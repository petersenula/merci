import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { authenticateApiRequest } from '@/lib/authenticateApiRequest';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateApiRequest(req);

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 },
      );
    }

    const { lang } = await req.json();
    const supabaseAdmin = getSupabaseAdmin();

    const { data: earner, error } = await supabaseAdmin
      .from('profiles_earner')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !earner) {
      return NextResponse.json({ error: 'Earner not found' }, { status: 404 });
    }

    if (earner.stripe_status !== 'deleted') {
      return NextResponse.json(
        { error: 'Stripe account is not marked as deleted' },
        { status: 409 },
      );
    }

    // 2️⃣ Создаём новый Stripe Express аккаунт
    const account = await stripe.accounts.create({
      type: 'express',
      country: earner.country_code ?? 'CH',
      default_currency: String(earner.currency ?? 'CHF').toLowerCase(),
      email: earner.email ?? undefined,
      business_profile: {
        url: "https://click4tip.ch",
        product_description: "Receiving tips for personal services via Click4Tip platform",
      },
      metadata: {
        earner_id: earner.id,
        recreated: 'true',
      },
    });

    // ✅ Disable automatic payouts (manual payouts)
    await stripe.balanceSettings.update(
      {
        payments: {
          payouts: {
            schedule: { interval: "manual" },
          },
        },
      },
      {
        stripeAccount: account.id, // sends Stripe-Account header
      }
    );

    // 3️⃣ Обновляем profiles_earner
    await supabaseAdmin
      .from('profiles_earner')
      .update({
        stripe_account_id: account.id,
        stripe_charges_enabled: account.charges_enabled,
        stripe_payouts_enabled: account.payouts_enabled,
        stripe_onboarding_complete: false,
        stripe_status: 'pending',
      })
      .eq('id', earner.id);

    // 4️⃣ Ledger sync
    await supabaseAdmin
      .from('ledger_sync_accounts')
      .upsert(
        {
          stripe_account_id: account.id,
          account_type: 'earner',
          internal_id: earner.id,
          is_active: true,
          last_synced_ts: 0,
        },
        { onConflict: 'stripe_account_id,account_type' }
      );

    // 5️⃣ Stripe onboarding
    const safeLang = ['en', 'de', 'fr', 'it'].includes(lang) ? lang : 'de';

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${appUrl}/earners/profile?tab=stripe&lang=${safeLang}`,
      return_url:
        `${appUrl}/auth/callback` +
        `?next=/earners/onboarding/complete` +
        `&lang=${safeLang}`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ onboardingUrl: accountLink.url });
  } catch (err: any) {
    console.error('earner stripe-recreate error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

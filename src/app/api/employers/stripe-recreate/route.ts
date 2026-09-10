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

    const { lang, stripe_business_type } = await req.json();
    const supabaseAdmin = getSupabaseAdmin();

    const { data: employer, error } = await supabaseAdmin
      .from('employers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error || !employer) {
      return NextResponse.json({ error: 'Employer not found' }, { status: 404 });
    }

    if (employer.stripe_account_id) {
      return NextResponse.json(
        { error: 'Employer already has a Stripe account' },
        { status: 409 },
      );
    }

    const canOpenAccount =
      employer.payment_account_mode === 'team_only' ||
      employer.stripe_status === 'deleted';

    if (!canOpenAccount) {
      return NextResponse.json(
        { error: 'Employer is not eligible to create a new Stripe account' },
        { status: 409 },
      );
    }

    const businessType =
      stripe_business_type === 'company'
        ? 'company'
        : 'individual';

    // 3) Создаём НОВЫЙ Stripe account
    const account = await stripe.accounts.create({
      type: 'express',
      country: (employer as any).country_code ?? 'CH',
      business_type: businessType,
      default_currency: String((employer as any).currency ?? 'CHF').toLowerCase(),
      email: (employer as any).billing_email ?? undefined,

      business_profile: {
        // можно и для company, и для individual — Stripe это принимает
        name: businessType === "company" ? ((employer as any).name ?? undefined) : undefined,

        // ✅ правильное поле Stripe:
        product_description:
          (employer as any).category ??
          "Receiving tips for services via Click4Tip platform",

        // ✅ сайт:
        url: "https://click4tip.ch",
      },

      metadata: {
        employer_user_id: employer.user_id,
        account_opened_from_profile: 'true',
        business_type: businessType,
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

    // 4) Обновляем ТУ ЖЕ строку employers (по user_id)
    await supabaseAdmin
      .from('employers')
      .update({
        stripe_account_id: account.id,
        stripe_charges_enabled: account.charges_enabled,
        stripe_payouts_enabled: account.payouts_enabled,
        stripe_onboarding_complete: false,
        stripe_status: 'pending',
        stripe_deleted_at: null,
        payment_account_mode: 'own_account',
      })
      .eq('user_id', user.id);

    // 5) Ledger sync
    await supabaseAdmin
      .from('ledger_sync_accounts')
      .upsert(
        {
          stripe_account_id: account.id,
          account_type: 'employer',
          internal_id: user.id,
          is_active: true,
          last_synced_ts: 0,
        },
        { onConflict: 'stripe_account_id,account_type' }
      );

    // 6) Stripe onboarding
    const safeLang = ['en', 'de', 'fr', 'it'].includes(lang) ? lang : 'de';

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${appUrl}/employers/profile?tab=stripe&lang=${safeLang}`,
      return_url:
        `${appUrl}/auth/callback` +
        `?next=/employers/onboarding/complete` +
        `&lang=${safeLang}`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ onboardingUrl: accountLink.url });
  } catch (err: any) {
    console.error('stripe-recreate error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

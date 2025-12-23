import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { user_id, lang } = await req.json();

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    // 1) Загружаем работодателя по user_id (у тебя нет employers.id)
    const { data: employer, error } = await supabaseAdmin
      .from('employers')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (error || !employer) {
      return NextResponse.json({ error: 'Employer not found' }, { status: 404 });
    }

    // 2) business_type: в таблице может НЕ быть stripe_business_type => берём безопасно
    const businessType =
      ((employer as any)?.stripe_business_type === 'company' ? 'company' : 'individual') as
        | 'company'
        | 'individual';

    // 3) Создаём НОВЫЙ Stripe account
    const account = await stripe.accounts.create({
      type: 'express',
      country: (employer as any).country_code ?? 'CH',
      business_type: businessType,
      default_currency: String((employer as any).currency ?? 'CHF').toLowerCase(),
      email: (employer as any).billing_email ?? undefined,

      business_profile:
        businessType === 'company'
          ? {
              name: (employer as any).name ?? undefined,
              product_description: (employer as any).category ?? undefined,
            }
          : undefined,

      metadata: {
        employer_user_id: (employer as any).user_id,
        recreated: 'true',
      },
    });

    // 4) Обновляем ТУ ЖЕ строку employers (по user_id)
    await supabaseAdmin
      .from('employers')
      .update({
        stripe_account_id: account.id,
        stripe_charges_enabled: account.charges_enabled,
        stripe_payouts_enabled: account.payouts_enabled,
        stripe_onboarding_complete: false,
        stripe_status: 'pending',
      })
      .eq('user_id', user_id);

    // 5) Ledger sync
    await supabaseAdmin
      .from('ledger_sync_accounts')
      .upsert(
        {
          stripe_account_id: account.id,
          account_type: 'employer',
          internal_id: user_id,
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
      return_url: `${appUrl}/employers/onboarding/complete?account=${account.id}&lang=${safeLang}`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ onboardingUrl: accountLink.url });
  } catch (err: any) {
    console.error('stripe-recreate error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

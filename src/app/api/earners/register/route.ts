// src/app/api/earners/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { generateUniqueSlug } from '@/lib/generateUniqueSlug';

export const runtime = 'nodejs';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;
const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

const stripe = new Stripe(stripeSecretKey);

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function POST(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const body = await req.json();

    const {
      userId,
      display_name,
      first_name,
      last_name,
      email,
      phone,
      city,
      country_code,
      lang,
    } = body;

    // 🔐 НОРМАЛИЗУЕМ EMAIL
    const safeEmail =
      typeof email === 'string' ? email.trim().toLowerCase() : null;

    // ------------------------------------------------
    // 1. Validate
    // ------------------------------------------------
    if (!userId || !isUuid(userId)) {
      return NextResponse.json(
        { error: 'Invalid userId (must be UUID)' },
        { status: 400 }
      );
    }

    if (!display_name || typeof display_name !== 'string') {
      return NextResponse.json(
        { error: 'display_name is required' },
        { status: 400 }
      );
    }

    const allowedCountries = ['CH', 'LI'] as const;

    const safeCountry =
      typeof country_code === 'string' && allowedCountries.includes(country_code.toUpperCase() as any)
        ? country_code.toUpperCase()
        : 'CH';

    const safeCurrency = 'CHF';

    const safeLang =
      typeof lang === 'string' && ['en','de','fr','it'].includes(lang)
        ? lang
        : 'de';

    // ------------------------------------------------
    // 2. Generate slug
    // ------------------------------------------------
    const slug = await generateUniqueSlug(display_name);

    // ------------------------------------------------
    // 3. Create Stripe Express account
    // ------------------------------------------------
    const account = await stripe.accounts.create({
      type: 'express',
      country: safeCountry,
      email: email || undefined,
      business_type: 'individual',
      default_currency: safeCurrency.toLowerCase(),
      business_profile: {
        url: "https://click4tip.ch",
        product_description: "Receiving tips for personal services via Click4Tip platform",
      },
      metadata: {
        user_id: userId,
        slug,
        display_name,
      },
    });

    // ------------------------------------------------
    // 4. Insert into profiles_earner
    // ------------------------------------------------
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles_earner')
      .insert({
        id: userId,
        display_name,
        first_name,
        last_name,
        slug,
        email,
        phone,
        city,
        country_code: safeCountry,
        currency: safeCurrency,
        stripe_account_id: account.id,
        stripe_charges_enabled: account.charges_enabled,   // ← ДОБАВИЛИ
        stripe_payouts_enabled: account.payouts_enabled,   // ← ДОБАВИЛИ
        lang: safeLang,
      })
      .select('*')
      .single();

    if (profileError) {
      console.error('DB error:', profileError);

      // Cleanup Stripe account
      try {
        await stripe.accounts.del(account.id);
      } catch (e) {
        console.error('Stripe cleanup failed:', e);
      }

      return NextResponse.json(
        { error: 'Failed to insert profile' },
        { status: 400 }
      );
    }

    // ✅ Register this Stripe account for ledger sync
    await supabaseAdmin
      .from('ledger_sync_accounts')
      .upsert(
        {
          stripe_account_id: account.id,
          account_type: 'earner',
          internal_id: userId,
          is_active: true,
          last_synced_ts: 0,
        },
        { onConflict: 'stripe_account_id,account_type' }
      );

    // ------------------------------------------------
    // 5. Stripe onboarding link
    // ------------------------------------------------
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${appUrl}/earners/onboarding/refresh?account=${account.id}`,
      return_url: `${appUrl}/earners/onboarding/complete?lang=${safeLang}`,
      type: 'account_onboarding',
    });

    return NextResponse.json({
      profile,
      onboardingUrl: accountLink.url,
    });
  } catch (err) {
    console.error('API error:', err);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

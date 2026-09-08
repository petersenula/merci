// src/app/api/earners/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { authenticateApiRequest } from '@/lib/authenticateApiRequest';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { generateUniqueSlug } from '@/lib/generateUniqueSlug';

export const runtime = 'nodejs';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;
const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

const stripe = new Stripe(stripeSecretKey);

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateApiRequest(req);

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 },
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const body = await req.json();

    const {
      display_name,
      first_name,
      last_name,
      phone,
      city,
      country_code,
      lang,
    } = body;

    const userId = user.id;

    if (!display_name || typeof display_name !== 'string') {
      return NextResponse.json(
        { error: 'display_name is required' },
        { status: 400 },
      );
    }

    const allowedCountries = ['CH', 'LI'] as const;

    const safeCountry =
      typeof country_code === 'string' &&
      allowedCountries.includes(country_code.toUpperCase() as 'CH' | 'LI')
        ? country_code.toUpperCase()
        : 'CH';

    const safeCurrency = 'CHF';

    const safeLang =
      typeof lang === 'string' && ['en', 'de', 'fr', 'it'].includes(lang)
        ? lang
        : 'de';

    const { data: existingEarner, error: existingEarnerError } =
      await supabaseAdmin
        .from('profiles_earner')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

    if (existingEarnerError) {
      console.error('Existing earner lookup error:', existingEarnerError);
      return NextResponse.json(
        { error: 'Earner lookup error' },
        { status: 500 },
      );
    }

    if (existingEarner?.stripe_account_id) {
      if (existingEarner.stripe_status === 'deleted') {
        return NextResponse.json(
          { error: 'Stripe account must be recreated' },
          { status: 409 },
        );
      }

      if (
        existingEarner.stripe_onboarding_complete === true ||
        existingEarner.stripe_charges_enabled === true
      ) {
        return NextResponse.json(
          { error: 'Earner is already registered' },
          { status: 409 },
        );
      }

      const existingAccountLink = await stripe.accountLinks.create({
        account: existingEarner.stripe_account_id,
        refresh_url: `${appUrl}/earners/register?lang=${safeLang}`,
        return_url:
          `${appUrl}/auth/callback` +
          `?next=/earners/onboarding/complete` +
          `&lang=${safeLang}`,
        type: 'account_onboarding',
        collect: 'eventually_due',
      });

      return NextResponse.json({
        profile: existingEarner,
        onboardingUrl: existingAccountLink.url,
      });
    }

    let safeEmail: string | null = null;

    try {
      const { data: userData, error: userError } =
        await supabaseAdmin.auth.admin.getUserById(userId);

      if (!userError && userData?.user?.email) {
        safeEmail = userData.user.email.trim().toLowerCase();
      }
    } catch (emailError) {
      console.error('Failed to load user email from auth:', emailError);
    }

    const slug =
      existingEarner?.slug || await generateUniqueSlug(display_name);

    const account = await stripe.accounts.create({
      type: 'express',
      country: safeCountry,
      email: safeEmail || undefined,
      business_type: 'individual',
      default_currency: safeCurrency.toLowerCase(),
      business_profile: {
        url: 'https://click4tip.ch',
        product_description:
          'Receiving tips for personal services via Click4Tip platform',
      },
      metadata: {
        user_id: userId,
        slug,
        display_name,
      },
    });

    await stripe.balanceSettings.update(
      {
        payments: {
          payouts: {
            schedule: { interval: 'manual' },
          },
        },
      },
      {
        stripeAccount: account.id,
      },
    );

    const profilePayload = {
      display_name,
      first_name,
      last_name,
      slug,
      email: safeEmail,
      phone,
      city,
      country_code: safeCountry,
      currency: safeCurrency,
      stripe_account_id: account.id,
      stripe_charges_enabled: account.charges_enabled,
      stripe_payouts_enabled: account.payouts_enabled,
      stripe_onboarding_complete: false,
      stripe_status: 'pending',
      lang: safeLang,
    };

    const profileWriteResult = existingEarner
      ? await supabaseAdmin
          .from('profiles_earner')
          .update(profilePayload)
          .eq('id', userId)
          .select('*')
          .single()
      : await supabaseAdmin
          .from('profiles_earner')
          .insert({
            id: userId,
            ...profilePayload,
          })
          .select('*')
          .single();

    const { data: profile, error: profileError } = profileWriteResult;

    if (profileError) {
      console.error('Profile write error:', profileError);

      try {
        await stripe.accounts.del(account.id);
      } catch (cleanupError) {
        console.error('Stripe cleanup failed:', cleanupError);
      }

      return NextResponse.json(
        { error: 'Failed to save profile' },
        { status: 400 },
      );
    }

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
        { onConflict: 'stripe_account_id,account_type' },
      );

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${appUrl}/earners/register?lang=${safeLang}`,
      return_url:
        `${appUrl}/auth/callback` +
        `?next=/earners/onboarding/complete` +
        `&lang=${safeLang}`,
      type: 'account_onboarding',
      collect: 'eventually_due',
    });

    return NextResponse.json({
      profile,
      onboardingUrl: accountLink.url,
    });
  } catch (err) {
    console.error('API error:', err);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

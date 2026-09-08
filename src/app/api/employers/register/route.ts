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
      name,
      category,
      phone,
      country_code,
      city,
      lang,

      // ⭐ НОВОЕ
      stripe_business_type,
    } = body;

    const user_id = user.id;

    if (!name) {
      return NextResponse.json({ error: "Missing company name" }, { status: 400 });
    }

    const ALLOWED_COUNTRIES = ['CH', 'LI'] as const;

    const safeCountry =
      typeof country_code === 'string' &&
      ALLOWED_COUNTRIES.includes(country_code.toUpperCase() as any)
        ? country_code.toUpperCase()
        : 'CH';

    if (!['CH', 'LI'].includes(safeCountry)) {
      return NextResponse.json(
        { error: "error.country_not_supported" },
        { status: 400 }
      );
    }

    const safeCurrency = 'CHF';
    const safeLang = ['en','de','fr','it'].includes(lang) ? lang : 'de';

    // ⭐ НОВОЕ: определяем тип Stripe-аккаунта
    const businessType =
      stripe_business_type === 'company'
        ? 'company'
        : 'individual';

    const { data: existingEmployer, error: existingEmployerError } =
      await supabaseAdmin
        .from('employers')
        .select('*')
        .eq('user_id', user_id)
        .maybeSingle();

    if (existingEmployerError) {
      console.error('Existing employer lookup error:', existingEmployerError);
      return NextResponse.json(
        { error: 'Employer lookup error' },
        { status: 500 },
      );
    }

    if (existingEmployer?.stripe_account_id) {
      if (existingEmployer.stripe_status === 'deleted') {
        return NextResponse.json(
          { error: 'Stripe account must be recreated' },
          { status: 409 },
        );
      }

      if (
        existingEmployer.stripe_onboarding_complete === true ||
        existingEmployer.stripe_charges_enabled === true
      ) {
        return NextResponse.json(
          { error: 'Employer is already registered' },
          { status: 409 },
        );
      }

      const existingAccountLink = await stripe.accountLinks.create({
        account: existingEmployer.stripe_account_id,
        refresh_url: `${appUrl}/employers/register?lang=${safeLang}`,
        return_url:
          `${appUrl}/auth/callback` +
          `?next=/employers/onboarding/complete` +
          `&lang=${safeLang}`,
        type: 'account_onboarding',
        collect: 'eventually_due',
      });

      return NextResponse.json({
        employer: existingEmployer,
        onboardingUrl: existingAccountLink.url,
      });
    }

    // 0. Получаем email из Supabase Auth
    let billingEmail: string | null = null;
    try {
      const { data: userData, error: userError } =
        await supabaseAdmin.auth.admin.getUserById(user_id);

      if (!userError && userData?.user?.email) {
        billingEmail = userData.user.email.trim().toLowerCase();
      }
    } catch (e) {
      console.error("Failed to load user email from auth:", e);
    }

    // 1. Reuse an existing profile slug or generate one for a new profile
    const slug =
      existingEmployer?.slug || await generateUniqueSlug(name);

    // 2. Создаём Stripe Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: safeCountry,

      // ⭐ ВАЖНО: теперь динамически
      business_type: businessType,

      default_currency: safeCurrency.toLowerCase(),
      email: billingEmail || undefined,

      business_profile:
        businessType === 'company'
          ? {
              name,
              product_description:
                category ||
                "Receiving tips for services via Click4Tip platform",
              url: "https://click4tip.ch",
            }
          : {
              product_description:
                "Receiving tips for personal services via Click4Tip platform",
              url: "https://click4tip.ch",
            },

      metadata: {
        employer_user_id: user_id,
        slug,
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

    // 3. Create a new employer profile or complete an existing profile
    const employerPayload = {
      name,
      slug,
      category,
      phone,
      country_code: safeCountry,
      currency: safeCurrency,
      locale: safeLang,
      address: city ? { city } : null,
      billing_email: billingEmail,
      stripe_account_id: account.id,
      stripe_charges_enabled: account.charges_enabled,
      stripe_payouts_enabled: account.payouts_enabled,
      stripe_onboarding_complete: false,
      stripe_status: 'pending',
      is_active: true,
    };

    const employerWriteResult = existingEmployer
      ? await supabaseAdmin
          .from('employers')
          .update(employerPayload)
          .eq('user_id', user_id)
          .select()
          .single()
      : await supabaseAdmin
          .from('employers')
          .insert({
            user_id,
            ...employerPayload,
            invite_code: crypto.randomUUID().slice(0, 8),
          })
          .select()
          .single();

    const { data, error } = employerWriteResult;

    if (error) {
      console.error('Employer write error:', error);
      await stripe.accounts.del(account.id);
      return NextResponse.json(
        { error: 'Employer write error' },
        { status: 500 },
      );
    }

    // ✅ Register this Stripe account for ledger sync
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

    // 4. Stripe onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${appUrl}/employers/register?lang=${safeLang}`,
      return_url:
        `${appUrl}/auth/callback` +
        `?next=/employers/onboarding/complete` +
        `&lang=${safeLang}`,
      type: 'account_onboarding',
      collect: 'eventually_due',
    });

    return NextResponse.json({
      employer: data,
      onboardingUrl: accountLink.url,
    });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

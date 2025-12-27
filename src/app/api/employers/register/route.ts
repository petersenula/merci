import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { generateUniqueSlug } from '@/lib/generateUniqueSlug';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;
const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

const stripe = new Stripe(stripeSecretKey);

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await req.json();

    const {
      user_id,
      name,
      category,
      phone,
      country_code,
      city,
      lang,

      // ⭐ НОВОЕ
      stripe_business_type,
    } = body;

    if (!user_id) {
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }

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

    // 1. Генерируем slug
    const slug = await generateUniqueSlug(name);

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

    // 3. Записываем работодателя в таблицу employers
    const { data, error } = await supabaseAdmin
      .from('employers')
      .insert({
        user_id,
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
        is_active: true,
        invite_code: crypto.randomUUID().slice(0, 8),
      })
      .select()
      .single();

    if (error) {
      console.error("Insert error:", error);
      await stripe.accounts.del(account.id);
      return NextResponse.json({ error: "Insert error" }, { status: 500 });
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
      return_url: `${appUrl}/employers/onboarding/complete?account=${account.id}&lang=${safeLang}`,
      type: 'account_onboarding',
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

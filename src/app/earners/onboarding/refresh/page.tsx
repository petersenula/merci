import { redirect } from 'next/navigation';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

type SearchParams = {
  searchParams: {
    account?: string;
  };
};

export default async function OnboardingRefreshPage({ searchParams }: SearchParams) {
  const accountId = searchParams.account;

  // ⚠️ НИКАКИХ throw — иначе билд упадёт
  if (!accountId) {
    redirect('/earners/onboarding');
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!stripeSecretKey || !appUrl) {
    console.error('Missing STRIPE_SECRET_KEY or NEXT_PUBLIC_APP_URL');
    redirect('/error');
  }

  const supabaseAdmin = getSupabaseAdmin();
  const stripe = new Stripe(stripeSecretKey);

  // Ищем профиль по Stripe account
  const { data: profile, error } = await supabaseAdmin
    .from('profiles_earner')
    .select('*')
    .eq('stripe_account_id', accountId)
    .single();

  if (error || !profile) {
    console.error('Profile not found for account', accountId);
    redirect('/error');
  }

  const lang = profile.lang ?? 'de';

  // Создаём новую onboarding-ссылку Stripe
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${appUrl}/earners/onboarding/refresh?account=${accountId}`,
    return_url: `${appUrl}/earners/onboarding/complete?lang=${lang}`,
    type: 'account_onboarding',
  });

  // Перенаправляем пользователя в Stripe
  redirect(accountLink.url);
}

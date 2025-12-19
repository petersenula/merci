import { redirect } from 'next/navigation';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

type PageProps = {
  searchParams: Promise<{ account?: string }>;
};

export default async function EmployerOnboardingComplete({ searchParams }: PageProps) {
  const supabaseAdmin = getSupabaseAdmin();
  // Next.js 13–16: searchParams — это Promise
  const params = await searchParams;
  const accountId = params.account;

  if (!accountId) {
    console.error('Missing account ID in onboarding callback');
    return redirect('/employers/profile');
  }

  // 1. Получаем актуальный статус Stripe
  const account = await stripe.accounts.retrieve(accountId);
  const onboardingComplete =
    account.details_submitted && account.charges_enabled;

  // 2. Обновляем employer в Supabase
  await supabaseAdmin
    .from('employers')
    .update({ stripe_onboarding_complete: onboardingComplete })
    .eq('stripe_account_id', accountId);

  // 3. Редирект обратно
  redirect('/employers/profile');
}

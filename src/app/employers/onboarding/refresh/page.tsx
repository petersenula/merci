export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const appUrl = process.env.NEXT_PUBLIC_APP_URL;

export default async function EmployerOnboardingRefreshPage({
  
  searchParams,
    }: {
      searchParams: { account?: string };
    }) {
  const accountId = searchParams.account;

  if (!accountId) throw new Error('Missing account ID');
  const supabaseAdmin = getSupabaseAdmin();
  const { data: employer, error } = await supabaseAdmin
    .from('employers')
    .select('*')
    .eq('stripe_account_id', accountId)
    .single();

  if (error || !employer) {
    console.error('Employer not found for account', accountId);
    throw new Error('Employer not found');
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${appUrl}/employers/onboarding/refresh?account=${accountId}`,
    return_url:
      `${appUrl}/auth/callback` +
      `?next=/employers/onboarding/complete`,
    type: 'account_onboarding',
  });

  redirect(accountLink.url);
}

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  const { employerUserId } = await req.json();

  if (!employerUserId) {
    return NextResponse.json({ error: 'Missing employerUserId' }, { status: 400 });
  }

  const { data: employer, error } = await supabaseAdmin
    .from('employers')
    .select('*')
    .eq('user_id', employerUserId)
    .single();

  if (error || !employer) {
    return NextResponse.json({ error: 'Employer not found' }, { status: 404 });
  }

  const link = await stripe.accountLinks.create({
    account: employer.stripe_account_id!,
    refresh_url: process.env.NEXT_PUBLIC_APP_URL + '/employers/profile',
    return_url:
      `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` +
      `?next=/employers/onboarding/complete`,
    type: 'account_onboarding',
  });

  return NextResponse.json({ url: link.url });
}

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret =
  process.env.STRIPE_WEBHOOK_SECRET_ACCOUNT_DELETED!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return new NextResponse('Missing Stripe signature', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch (err: any) {
    console.error('❌ Stripe webhook signature verification failed:', err.message);
    return new NextResponse('Invalid signature', { status: 400 });
  }

  // ============================
  // 🔒 ФИЛЬТР СОБЫТИЙ (ВАЖНО)
  // ============================
  const allowedEvents = [
    'account.application.deauthorized',
    'account.external_account.deleted',
  ];

  if (!allowedEvents.includes(event.type)) {
    // ⛔ НЕ перехватываем чужие события
    return new NextResponse('Event ignored', { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  // =====================================================
  // ACCOUNT DEAUTHORIZED / DELETED
  // =====================================================
  if (event.type === 'account.application.deauthorized') {
    const stripeAccountId = event.account as string;

    console.log('⚠️ Stripe account deauthorized:', stripeAccountId);

    // --- Employers ---
    await supabaseAdmin
      .from('employers')
      .update({
        stripe_account_id: null,
        stripe_charges_enabled: false,
        stripe_payouts_enabled: false,
        stripe_onboarding_complete: false,
        stripe_status: 'deleted',
      })
      .eq('stripe_account_id', stripeAccountId);

    // --- Earners ---
    await supabaseAdmin
      .from('profiles_earner')
      .update({
        stripe_account_id: null,
        stripe_charges_enabled: false,
        stripe_payouts_enabled: false,
        stripe_onboarding_complete: false,
        stripe_status: 'deleted',
      })
      .eq('stripe_account_id', stripeAccountId);
  }

  return NextResponse.json({ received: true });
}

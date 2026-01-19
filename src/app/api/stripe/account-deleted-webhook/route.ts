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
    console.error('❌ Invalid signature:', err.message);
    return new NextResponse('Invalid signature', { status: 400 });
  }

  // ✅ ВСЕГДА отвечаем 200, если подпись валидна
  try {
    if (event.type === 'account.application.deauthorized') {
      const stripeAccountId = event.account as string;

      console.log('⚠️ Account deauthorized:', stripeAccountId);

      const supabaseAdmin = getSupabaseAdmin();

      await Promise.all([
        supabaseAdmin
          .from('employers')
          .update({
            stripe_account_id: null,
            stripe_charges_enabled: false,
            stripe_payouts_enabled: false,
            stripe_onboarding_complete: false,
            stripe_status: 'deleted',
          })
          .eq('stripe_account_id', stripeAccountId),

        supabaseAdmin
          .from('profiles_earner')
          .update({
            stripe_account_id: null,
            stripe_charges_enabled: false,
            stripe_payouts_enabled: false,
            stripe_onboarding_complete: false,
            stripe_status: 'deleted',
          })
          .eq('stripe_account_id', stripeAccountId),

        // 🆕 ledger sync — помечаем счёт как неактивный
        supabaseAdmin
          .from('ledger_sync_accounts')
          .update({
            is_active: false,
          })
          .eq('stripe_account_id', stripeAccountId),
      ]);
    }

    // другие события можно просто игнорировать
  } catch (err) {
    // ❗️даже если БД упала — Stripe должен получить 200
    console.error('Webhook processing error:', err);
  }

  return NextResponse.json({ received: true });
}

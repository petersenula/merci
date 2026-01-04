import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const webhookSecret = process.env.STRIPE_LEDGER_WEBHOOK_SECRET!;
const SUPABASE_FUNCTION_URL =
  process.env.NEXT_PUBLIC_SUPABASE_FUNCTION_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new NextResponse("Missing stripe-signature", { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch (err: any) {
    console.error("❌ Invalid Stripe signature:", err.message);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  // Для connected accounts Stripe всегда присылает event.account
  const stripeAccountId = event.account;

  if (!stripeAccountId) {
    // Например, platform event — нам тут не нужен
    return NextResponse.json({
      ok: true,
      ignored: true,
      reason: "no stripe account",
    });
  }

  // 🔔 WEBHOOK = ТОЛЬКО СИГНАЛ
  try {
    await fetch(`${SUPABASE_FUNCTION_URL}/ledger_mark_dirty`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode: "connected",
        stripe_account_id: stripeAccountId,
        source: "webhook",
        event_type: event.type,
      }),
    });
  } catch (err) {
    console.error("❌ Failed to notify Supabase:", err);
    return new NextResponse("Failed to forward webhook", { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    received: true,
    stripe_account_id: stripeAccountId,
  });
}

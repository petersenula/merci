import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const webhookSecret =
  process.env.STRIPE_PLATFORM_LEDGER_SECRET!;
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
    console.error(
      "❌ Invalid Stripe signature (platform):",
      err.message
    );
    return new NextResponse("Invalid signature", { status: 400 });
  }

  console.log("🔔 PLATFORM LEDGER WEBHOOK:", event.type);

  // 🔔 WEBHOOK = ТОЛЬКО СИГНАЛ
  try {
    await fetch(`${SUPABASE_FUNCTION_URL}/ledger_mark_dirty`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode: "platform",
        source: "webhook",
        event_type: event.type,
      }),
    });
  } catch (err) {
    console.error("❌ Failed to notify Supabase (platform):", err);
    return new NextResponse("Failed to forward webhook", { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    received: true,
    platform: true,
  });
}

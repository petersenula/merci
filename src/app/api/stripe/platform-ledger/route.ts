import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const webhookSecret = process.env.STRIPE_PLATFORM_LEDGER_SECRET!;
const SUPABASE_FUNCTION_URL =
  process.env.NEXT_PUBLIC_SUPABASE_FUNCTION_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Platform ledger webhook
 * Role:
 *  - verify Stripe signature
 *  - trigger Supabase platform ledger import
 *  - NOTHING ELSE
 */
export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return new NextResponse("Missing stripe-signature", { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error("❌ Invalid Stripe signature (platform):", err.message);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  console.log("🔔 PLATFORM LEDGER WEBHOOK", {
    type: event.type,
  });

  // 🔥 Webhook = только триггер
  const res = await fetch(
    `${SUPABASE_FUNCTION_URL}/manual_ledger_import`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode: "platform",
      }),
    }
  );

  const data = await res.json();

  return NextResponse.json({
    ok: true,
    forwarded: true,
    result: data,
  });
}

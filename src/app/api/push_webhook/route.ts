import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_PUSH_WEBHOOK_SECRET;

  if (!sig || !secret) {
    return new NextResponse("Missing signature or secret", { status: 400 });
  }

  const body = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err: any) {
    console.error("❌ Signature error:", err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log("🔥 Push webhook received:", event.type);

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object;

    console.log("💰 Tip received:", intent.id);
  }

  return NextResponse.json({ ok: true });
}

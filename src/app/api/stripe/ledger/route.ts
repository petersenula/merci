import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  fetchStripeLedgerPaged,
  saveLedgerItems,
} from "@/supabase/functions/ledger_shared";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const webhookSecret = process.env.STRIPE_LEDGER_WEBHOOK_SECRET!;

/**
 * Connected accounts ledger webhook
 * Role:
 *  - verify Stripe signature
 *  - detect connected account
 *  - import balance transactions for short window
 *  - store RAW ledger transactions
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
    console.error("❌ Invalid Stripe signature:", err.message);
    return new NextResponse(`Webhook error: ${err.message}`, { status: 400 });
  }

  // Мы используем webhook ТОЛЬКО как триггер
  // Тип события здесь не критичен
  const stripeAccountId = event.account;
  if (!stripeAccountId) {
    console.log("ℹ️ Event without account → ignore");
    return NextResponse.json({ ok: true });
  }

  // --------------------------------------------------
  // Import window: last 2 days (safe, idempotent)
  // --------------------------------------------------
  const now = Math.floor(Date.now() / 1000);
  const fromTs = now - 2 * 24 * 60 * 60;
  const toTs = now;

  try {
    console.log("🔔 CONNECTED LEDGER WEBHOOK", {
      account: stripeAccountId,
      fromTs,
      toTs,
    });

    const items = await fetchStripeLedgerPaged(
      stripeAccountId,
      fromTs,
      toTs
    );

    const inserted = await saveLedgerItems(
      stripeAccountId,
      items
    );

    console.log("✅ CONNECTED LEDGER IMPORT DONE", {
      account: stripeAccountId,
      fetched: items.length,
      inserted,
    });

    return NextResponse.json({
      ok: true,
      fetched: items.length,
      inserted,
    });
  } catch (err) {
    console.error("❌ CONNECTED LEDGER IMPORT FAILED", err);
    return new NextResponse("Ledger import failed", { status: 500 });
  }
}

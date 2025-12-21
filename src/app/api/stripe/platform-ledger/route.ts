import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  fetchStripeLedgerPaged,
} from "@/supabase/functions/ledger_shared";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const webhookSecret = process.env.STRIPE_PLATFORM_LEDGER_SECRET!;

/**
 * Platform ledger webhook
 * Role:
 *  - verify Stripe signature
 *  - trigger RAW ledger import for PLATFORM (accountId = null)
 *  - store RAW balance transactions into ledger_platform_transactions
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
    return new NextResponse(`Webhook error: ${err.message}`, { status: 400 });
  }

  // Webhook = trigger only
  console.log("🔔 PLATFORM LEDGER WEBHOOK", {
    type: event.type,
  });

  // --------------------------------------------------
  // Import window: last 2 days (idempotent)
  // --------------------------------------------------
  const now = Math.floor(Date.now() / 1000);
  const fromTs = now - 2 * 24 * 60 * 60;
  const toTs = now;

  try {
    // 1) Fetch platform balance transactions (accountId = null)
    const items = await fetchStripeLedgerPaged(
      null,
      fromTs,
      toTs
    );

    // 2) Save into ledger_platform_transactions
    const supabaseAdmin = getSupabaseAdmin();
    let inserted = 0;

    for (const t of items) {
      // Stripe fee
      const stripeFee =
        t.fee_details?.reduce((sum, f) => sum + f.amount, 0) ?? 0;

      // Application fee (if any)
      let applicationFee = 0;
      if (
        typeof t.source !== "string" &&
        t.source?.object === "charge" &&
        t.source.payment_intent
      ) {
        try {
          const pi = await stripe.paymentIntents.retrieve(
            t.source.payment_intent
          );
          applicationFee = pi.application_fee_amount ?? 0;
        } catch (err) {
          console.warn("⚠️ Cannot load payment intent for fee:", err);
        }
      }

      const { error } = await supabaseAdmin
        .from("ledger_platform_transactions")
        .upsert(
          {
            stripe_balance_transaction_id: t.id,
            type: t.type,
            reporting_category: t.reporting_category,
            currency: t.currency.toUpperCase(),
            amount_gross_cents: t.amount,
            net_cents: t.net,
            stripe_fee_cents: stripeFee,
            application_fee_cents: applicationFee,
            created_at: new Date(t.created * 1000).toISOString(),
            raw: t,
          },
          { onConflict: "stripe_balance_transaction_id" }
        );

      if (!error) inserted++;
    }

    console.log("✅ PLATFORM LEDGER IMPORT DONE", {
      fetched: items.length,
      inserted,
    });

    return NextResponse.json({
      ok: true,
      fetched: items.length,
      inserted,
    });
  } catch (err) {
    console.error("❌ PLATFORM LEDGER IMPORT FAILED", err);
    return new NextResponse("Platform ledger import failed", { status: 500 });
  }
}

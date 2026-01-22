import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) throw new Error("STRIPE_SECRET_KEY is not set");

const stripe = new Stripe(stripeSecretKey);

export async function GET(req: Request) {
  return POST(req);
}

export async function POST(req: Request) {
  // 🔐 Простая защита через URL secret
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");

  if (!process.env.FX_RETRY_SECRET) {
    throw new Error("FX_RETRY_SECRET is not set");
  }

  if (secret !== process.env.FX_RETRY_SECRET) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const nowIso = new Date().toISOString();

  // 1️⃣ Берём ТОЛЬКО pending_fx
  const { data: candidates, error } = await supabaseAdmin
    .from("tips")
    .select("id, payment_intent_id, fx_retry_count")
    .eq("distribution_status", "pending_fx")
    .not("payment_intent_id", "is", null)
    .lte("fx_next_retry_at", nowIso)
    .order("created_at", { ascending: true })
    .limit(25);

  if (error) {
    console.error("❌ fx-retry: failed to load candidates:", error);
    return NextResponse.json({ ok: false });
  }

  if (!candidates || candidates.length === 0) {
    return NextResponse.json({ ok: true, processed: 0 });
  }

  let processed = 0;

  for (const tip of candidates) {
    try {
      await tryFxSettlementOnly({
        tipId: tip.id,
        paymentIntentId: tip.payment_intent_id!,
        retryCount: tip.fx_retry_count ?? 0,
      });

      processed++;
    } catch (e: any) {
      console.error("❌ fx-retry: unexpected error:", e);

      await scheduleNextRetry({
        tipId: tip.id,
        retryCount: tip.fx_retry_count ?? 0,
        fallbackDelayMs: 5 * 60_000,
      });
    }
  }

  return NextResponse.json({ ok: true, processed });
}

// ===================================================================
// FX SETTLEMENT ONLY (NO DISTRIBUTION HERE)
// ===================================================================

async function tryFxSettlementOnly(args: {
  tipId: string;
  paymentIntentId: string;
  retryCount: number;
}) {
  const { tipId, paymentIntentId, retryCount } = args;
  const supabaseAdmin = getSupabaseAdmin();

  const intent = await stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ["latest_charge"],
  });

  const charge: any = intent.latest_charge;
  const balanceTxnId = charge?.balance_transaction;

  // ❄️ settlement ещё не готов
  if (!balanceTxnId) {
    await scheduleNextRetry({
      tipId,
      retryCount,
      fallbackDelayMs: 5 * 60_000,
    });
    return;
  }

  const bt = await stripe.balanceTransactions.retrieve(balanceTxnId);

  // ❌ неожиданная валюта
  if ((bt.currency || "").toLowerCase() !== "chf") {
    await failTip(tipId, "Unexpected settlement currency");
    return;
  }

  // ✅ settlement ГОТОВ → переводим в waiting_funds
  await supabaseAdmin
    .from("tips")
    .update({
      stripe_charge_id: charge?.id ?? null,
      stripe_balance_txn_id: balanceTxnId,
      settlement_gross_cents: bt.amount,
      settlement_net_cents: bt.net,
      distribution_status: "waiting_funds",
      fx_next_retry_at: null,
    })
    .eq("id", tipId);
}

// ===================================================================
// RETRY / FAIL HELPERS
// ===================================================================

async function scheduleNextRetry(args: {
  tipId: string;
  retryCount: number;
  fallbackDelayMs: number;
}) {
  const { tipId, retryCount, fallbackDelayMs } = args;
  const supabaseAdmin = getSupabaseAdmin();

  const nextCount = retryCount + 1;

  // максимум 12 попыток (~1 час)
  if (nextCount > 12) {
    await failTip(tipId, "FX settlement timeout");
    return;
  }

  const delayMs = nextCount === 1 ? 60_000 : fallbackDelayMs;

  await supabaseAdmin
    .from("tips")
    .update({
      distribution_status: "pending_fx",
      fx_retry_count: nextCount,
      fx_next_retry_at: new Date(Date.now() + delayMs).toISOString(),
    })
    .eq("id", tipId);
}

async function failTip(tipId: string, message: string) {
  const supabaseAdmin = getSupabaseAdmin();
  await supabaseAdmin
    .from("tips")
    .update({
      distribution_status: "failed",
      distribution_error: message,
      fx_next_retry_at: null,
    })
    .eq("id", tipId);
}

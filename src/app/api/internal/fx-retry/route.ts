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
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const nowIso = new Date().toISOString();

  // 2️⃣ Берём pending_fx — ждём settlement
  const { data: pendingFx, error: pendingErr } = await supabaseAdmin
    .from("tips")
    .select("id, payment_intent_id, scheme_id, employer_id, fx_retry_count")
    .eq("distribution_status", "pending_fx")
    .not("payment_intent_id", "is", null)
    .not("scheme_id", "is", null)
    .not("employer_id", "is", null)
    .lte("fx_next_retry_at", nowIso)
    .order("created_at", { ascending: true })
    .limit(25);

  if (pendingErr) {
    console.error("❌ fx-retry: failed to load pending_fx:", pendingErr);
    return NextResponse.json({ ok: false });
  }

  // 3️⃣ Берём waiting_funds — settlement уже есть, просто распределяем
  const { data: waitingFunds, error: waitingErr } = await supabaseAdmin
    .from("tips")
    .select("id, payment_intent_id, scheme_id, employer_id, fx_retry_count")
    .eq("distribution_status", "waiting_funds")
    .not("scheme_id", "is", null)
    .not("employer_id", "is", null)
    .order("created_at", { ascending: true })
    .limit(25);

  if (waitingErr) {
    console.error("❌ fx-retry: failed to load waiting_funds:", waitingErr);
    return NextResponse.json({ ok: false });
  }

  // 4️⃣ Объединяем в один список
  const candidates = [
    ...(pendingFx ?? []),
    ...(waitingFunds ?? []),
  ];

  if (candidates.length === 0) {
    return NextResponse.json({ ok: true, processed: 0 });
  }

  let processed = 0;

  for (const tip of candidates) {
    // 3) Захватываем tip, чтобы не обработать его дважды
    //    Если другой запрос уже обрабатывает — этот update ничего не вернёт.
    const { data: locked } = await supabaseAdmin
      .from("tips")
      .update({
        distribution_status: "fx_processing",
      })
      .eq("id", tip.id)
      .in("distribution_status", ["pending_fx", "waiting_funds"])
      .select("id, payment_intent_id, scheme_id, employer_id, fx_retry_count")
      .maybeSingle();

    if (!locked) {
      continue;
    }

    try {
      await tryFxSettlementAndDistribute({
        tipId: locked.id,
        paymentIntentId: locked.payment_intent_id!,
        schemeId: locked.scheme_id!,
        employerId: locked.employer_id!,
        retryCount: locked.fx_retry_count ?? 0,
      });

      processed++;
    } catch (e: any) {
      console.error("❌ fx-retry: unexpected error:", e);

      // если упали — возвращаем обратно в pending_fx и планируем следующий retry
      await scheduleNextRetry({
        tipId: locked.id,
        retryCount: locked.fx_retry_count ?? 0,
        fallbackDelayMs: 5 * 60_000,
      });
    }
  }

  return NextResponse.json({ ok: true, processed });
}

async function tryFxSettlementAndDistribute(args: {
  tipId: string;
  paymentIntentId: string;
  schemeId: string;
  employerId: string;
  retryCount: number;
}) {
  const { tipId, paymentIntentId, schemeId, employerId, retryCount } = args;
  const supabaseAdmin = getSupabaseAdmin();

  // 🟢 Если уже waiting_funds — settlement уже есть, идём сразу в распределение
const { data: tipRow } = await supabaseAdmin
  .from("tips")
  .select("distribution_status, stripe_charge_id, settlement_gross_cents, settlement_net_cents")
  .eq("id", tipId)
  .single();

if (tipRow?.distribution_status === "waiting_funds") {
  if (!tipRow.stripe_charge_id) {
    await failTip(tipId, "Missing stripe_charge_id for waiting_funds");
    return;
  }

  // ⚠️ ВАЖНО: дальше используем уже сохранённый charge
  await distributeWithKnownSettlement({
    tipId,
    schemeId,
    employerId,
    chargeId: tipRow.stripe_charge_id,
    settlementGrossCents: tipRow.settlement_gross_cents!,
    settlementNetCents: tipRow.settlement_net_cents!,
  });

  return;
}

  // 1) Смотрим charge и balance_transaction
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ["latest_charge"],
  });

  const charge: any = intent.latest_charge;
  const balanceTxnId = charge?.balance_transaction;

  // settlement ещё не готов
  if (!balanceTxnId) {
    await scheduleNextRetry({ tipId, retryCount, fallbackDelayMs: 5 * 60_000 });
    return;
  }

  const bt = await stripe.balanceTransactions.retrieve(balanceTxnId);

  // вдруг settlement не в CHF — это ошибка
  if ((bt.currency || "").toLowerCase() !== "chf") {
    await failTip(tipId, "Unexpected settlement currency");
    return;
  }

  // 2) Записываем settlement в tips
  await supabaseAdmin
    .from("tips")
    .update({
      stripe_charge_id: charge?.id ?? null,
      stripe_balance_txn_id: balanceTxnId,
      settlement_gross_cents: bt.amount,
      settlement_net_cents: bt.net,

      // готово к распределению
      distribution_status: "pending",
      fx_next_retry_at: null,
    })
    .eq("id", tipId);

  // 3) Считаем distributable и распределяем (логика как в твоём distributeSchemeFxChf)
  const { data: employerFee } = await supabaseAdmin
    .from("employers")
    .select("platform_fee_percent")
    .eq("user_id", employerId)
    .maybeSingle();

  const feePercent = Number(employerFee?.platform_fee_percent ?? 5);
  const platformFee = Math.round(bt.amount * (feePercent / 100));
  const distributable = Math.max(bt.net - platformFee, 0);

  const { data: parts } = await supabaseAdmin
    .from("allocation_scheme_parts")
    .select("*")
    .eq("scheme_id", schemeId)
    .order("part_index");

  if (!parts || parts.length === 0) {
    await failTip(tipId, "Scheme has no parts");
    return;
  }

  let allSucceeded = true;
  let remaining = distributable;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const isLast = i === parts.length - 1;

    let amountForPart = Math.floor(distributable * (part.percent / 100));
    if (isLast) amountForPart = remaining;

    amountForPart = Math.max(amountForPart, 0);
    remaining -= amountForPart;

    if (part.destination_type === "earner") {
      if (!part.destination_id) {
        allSucceeded = false;
        continue;
      }

      const { data: worker } = await supabaseAdmin
        .from("profiles_earner")
        .select("stripe_account_id")
        .eq("id", part.destination_id)
        .maybeSingle();

      if (!worker?.stripe_account_id) {
        allSucceeded = false;
        continue;
      }

      const ok = await createSplitSafe({
        tipId,
        part,
        amountCents: amountForPart,
        currency: "chf",
        destinationAccountId: worker.stripe_account_id,
        destinationKind: "earner",
        destinationId: part.destination_id,
        sourceChargeId: charge.id,
      });

      if (!ok) allSucceeded = false;
    }

    if (part.destination_type === "employer") {
      const { data: emp } = await supabaseAdmin
        .from("employers")
        .select("stripe_account_id")
        .eq("user_id", employerId)
        .maybeSingle();

      if (!emp?.stripe_account_id) {
        allSucceeded = false;
        continue;
      }

      const ok = await createSplitSafe({
        tipId,
        part,
        amountCents: amountForPart,
        currency: "chf",
        destinationAccountId: emp.stripe_account_id,
        destinationKind: "employer",
        destinationId: employerId,
        sourceChargeId: charge.id,
      });

      if (!ok) allSucceeded = false;
    }
  }

  await supabaseAdmin
    .from("tips")
    .update({
      distribution_status: allSucceeded ? "distributed" : "failed",
      distribution_error: allSucceeded ? null : "FX distribution failed",
    })
    .eq("id", tipId);
}

async function scheduleNextRetry(args: {
  tipId: string;
  retryCount: number;
  fallbackDelayMs: number;
}) {
  const { tipId, retryCount, fallbackDelayMs } = args;
  const supabaseAdmin = getSupabaseAdmin();

  const nextCount = retryCount + 1;

  // сколько максимум пытаться (например 12 попыток ~ примерно час+)
  if (nextCount > 12) {
    await failTip(tipId, "FX settlement timeout");
    return;
  }

  const delayMs = nextCount === 1 ? 60_000 : fallbackDelayMs; // 1 мин, потом 5 мин

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

async function distributeWithKnownSettlement(args: {
  tipId: string;
  schemeId: string;
  employerId: string;
  chargeId: string;
  settlementGrossCents: number;
  settlementNetCents: number;
}) {
  const {
    tipId,
    schemeId,
    employerId,
    chargeId,
    settlementGrossCents,
    settlementNetCents,
  } = args;

  const supabaseAdmin = getSupabaseAdmin();

  const { data: employerFee } = await supabaseAdmin
    .from("employers")
    .select("platform_fee_percent")
    .eq("user_id", employerId)
    .maybeSingle();

  const feePercent = Number(employerFee?.platform_fee_percent ?? 5);
  const platformFee = Math.round(settlementGrossCents * (feePercent / 100));
  const distributable = Math.max(settlementNetCents - platformFee, 0);

  const { data: parts } = await supabaseAdmin
    .from("allocation_scheme_parts")
    .select("*")
    .eq("scheme_id", schemeId)
    .order("part_index");

  if (!parts || parts.length === 0) {
    await failTip(tipId, "Scheme has no parts");
    return;
  }

  let allSucceeded = true;
  let remaining = distributable;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const isLast = i === parts.length - 1;

    let amountForPart = Math.floor(distributable * (part.percent / 100));
    if (isLast) amountForPart = remaining;

    amountForPart = Math.max(amountForPart, 0);
    remaining -= amountForPart;

    if (part.destination_type === "earner") {
      const { data: worker } = await supabaseAdmin
        .from("profiles_earner")
        .select("stripe_account_id")
        .eq("id", part.destination_id)
        .maybeSingle();

      if (!worker?.stripe_account_id) {
        allSucceeded = false;
        continue;
      }

      const ok = await createSplitSafe({
        tipId,
        part,
        amountCents: amountForPart,
        currency: "chf",
        destinationAccountId: worker.stripe_account_id,
        destinationKind: "earner",
        destinationId: part.destination_id,
        sourceChargeId: chargeId,
      });

      if (!ok) allSucceeded = false;
    }

    if (part.destination_type === "employer") {
      const { data: emp } = await supabaseAdmin
        .from("employers")
        .select("stripe_account_id")
        .eq("user_id", employerId)
        .maybeSingle();

      if (!emp?.stripe_account_id) {
        allSucceeded = false;
        continue;
      }

      const ok = await createSplitSafe({
        tipId,
        part,
        amountCents: amountForPart,
        currency: "chf",
        destinationAccountId: emp.stripe_account_id,
        destinationKind: "employer",
        destinationId: employerId,
        sourceChargeId: chargeId,
      });

      if (!ok) allSucceeded = false;
    }
  }

  await supabaseAdmin
    .from("tips")
    .update({
      distribution_status: allSucceeded ? "distributed" : "failed",
      distribution_error: allSucceeded ? null : "FX distribution failed",
    })
    .eq("id", tipId);
}

// ⚠️ ВАЖНО: используем твою существующую функцию (скопируй её из webhook файла A)
async function createSplitSafe({
  tipId,
  part,
  amountCents,
  currency,
  destinationAccountId,
  destinationKind,
  destinationId,
  sourceChargeId,
}: {
  tipId: string;
  part: any;
  amountCents: number;
  currency: string;
  destinationAccountId: string;
  destinationKind: "earner" | "employer";
  destinationId: string;
  sourceChargeId: string;
}) {
  // ✅ 1. Получаем supabase ОДИН РАЗ
  const supabaseAdmin = getSupabaseAdmin();

  // ✅ 2. Получаем рейтинг ДО try/catch
  const { data: tip } = await supabaseAdmin
    .from("tips")
    .select("review_rating")
    .eq("id", tipId)
    .single();

  try {
    // ✅ 3. Stripe transfer
    const transfer = await stripe.transfers.create(
      {
        amount: amountCents,
        currency,
        destination: destinationAccountId,
        transfer_group: `scheme_${part.scheme_id}`,
        source_transaction: sourceChargeId,
      },
      {
        idempotencyKey: `tip_split_${tipId}_${part.part_index}`,
      },
    );

    // ✅ 4. SUCCESS split
    await supabaseAdmin.from("tip_splits").upsert(
      {
        tip_id: tipId,
        part_index: part.part_index,
        label: part.label,
        percent: part.percent,
        amount_cents: amountCents,
        destination_kind: destinationKind,
        destination_id: destinationId,
        stripe_transfer_id: transfer.id,
        status: "succeeded",
        error_message: null,
        review_rating: tip?.review_rating ?? null, // ⭐ работает
      },
      { onConflict: "tip_id,part_index" }
    );

    return true;
  } catch (e: any) {
    // ✅ 5. FAILED split (tip доступен!)
    await supabaseAdmin.from("tip_splits").upsert(
      {
        tip_id: tipId,
        part_index: part.part_index,
        label: part.label,
        percent: part.percent,
        amount_cents: amountCents,
        destination_kind: destinationKind,
        destination_id: destinationId,
        stripe_transfer_id: null,
        status: "failed",
        error_message: e?.message ?? "unknown error",
        review_rating: tip?.review_rating ?? null, // ⭐ теперь ОК
      },
      { onConflict: "tip_id,part_index" }
    );

    return false;
  }
}

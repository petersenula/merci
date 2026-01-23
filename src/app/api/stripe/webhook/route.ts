import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeSecretKey) throw new Error("STRIPE_SECRET_KEY is not set");
if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");

const stripe = new Stripe(stripeSecretKey);

// ===================================================================
// WEBHOOK ENTRY
// ===================================================================

export async function POST(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("Missing stripe-signature", { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret as string);
  } catch (err: any) {
    console.error("❌ Signature verify failed:", err.message);
    return new NextResponse(`Webhook error: ${err.message}`, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    try {
      await handlePayment(event.data.object as Stripe.PaymentIntent);
    } catch (err) {
      console.error("❌ payment_intent handler error:", err);
      return new NextResponse("Internal error", { status: 500 });
    }
  }

  if (event.type === "balance.available") {
    try {
      await processPendingFxBatch();
    } catch (err) {
      console.error("❌ balance.available handler error:", err);
    }
  }

  if (event.type === "account.updated") {
    try {
      await handleAccountUpdated(event.data.object as Stripe.Account);
    } catch (err) {
      // ⛔️ ВАЖНО: возвращаем НЕ 2xx
      return new NextResponse("Account update failed", { status: 500 });
    }
  }

  if (event.type === "transfer.created") {
    await handleTransferCreated(event.data.object as Stripe.Transfer);
  }

  return NextResponse.json({ received: true });
}

// ===================================================================
// ACCOUNT UPDATED
// ===================================================================

async function handleAccountUpdated(account: Stripe.Account) {
  const supabaseAdmin = getSupabaseAdmin();

  const payload = {
    stripe_onboarding_complete: account.details_submitted === true,
    stripe_charges_enabled: account.charges_enabled === true,
    stripe_payouts_enabled: account.payouts_enabled === true,
  };

  // 1️⃣ пробуем обновить работника
  const { count: earnerCount } = await supabaseAdmin
    .from("profiles_earner")
    .update(payload, { count: "exact" })
    .eq("stripe_account_id", account.id);

  if (earnerCount && earnerCount > 0) {
    return; // ✅ успешно
  }

  // 2️⃣ пробуем обновить работодателя
  const { count: employerCount } = await supabaseAdmin
    .from("employers")
    .update(payload, { count: "exact" })
    .eq("stripe_account_id", account.id);

  if (employerCount && employerCount > 0) {
    return; // ✅ успешно
  }

  // 3️⃣ ❌ НИЧЕГО НЕ ОБНОВИЛОСЬ → ЭТО ОШИБКА
  // Stripe обязан повторить webhook
  throw new Error(
    `Stripe account ${account.id} not found in DB yet`
  );
}

// ===================================================================
// PAYMENT HANDLER (CHF IMMEDIATE, FX → pending_fx)
// ===================================================================

async function handlePayment(intent: Stripe.PaymentIntent) {
  const earnerId = intent.metadata.earner_id || null;
  const employerId = intent.metadata.employer_id || null;
  const schemeId = intent.metadata.scheme_id || null;
  const feePercent = Number(intent.metadata.fee_percent || 0);
  const isChf = (intent.currency || "").toLowerCase() === "chf";
  const ratingRaw = intent.metadata?.rating;
  const reviewRating =
    ratingRaw !== undefined && ratingRaw !== null && ratingRaw !== ""
      ? Number(ratingRaw)
      : null;
  const supabaseAdmin = getSupabaseAdmin();
  // ----------------------------------------------------
  // Idempotency (tips)
  // ----------------------------------------------------
  const { data: existingTip } = await supabaseAdmin
    .from("tips")
    .select("id")
    .eq("payment_intent_id", intent.id)
    .maybeSingle();

  let tipId: string;

  if (existingTip) {
    tipId = existingTip.id;
  } else {
    const gross = intent.amount;
    const stripeFee = Math.round(30 + gross * 0.029);
    const platformFee = Math.round(gross * (feePercent / 100));
    const distributable = Math.max(gross - platformFee - stripeFee, 0);

    let earnerForTip: string | null = earnerId;
    let employerForTip: string | null = employerId;

    if (schemeId && employerId) earnerForTip = null;
    if (!schemeId && employerId && !earnerId) earnerForTip = null;
    const supabaseAdmin = getSupabaseAdmin();
    const { data: tip, error } = await supabaseAdmin
      .from("tips")
      .insert({
        earner_id: earnerForTip,
        employer_id: employerForTip,
        scheme_id: schemeId,
        amount_gross_cents: gross,
        amount_net_cents: distributable,
        currency: intent.currency.toUpperCase(),
        status: "succeeded",
        payment_intent_id: intent.id,
        payment_amount_cents: intent.amount,
        payment_currency: intent.currency?.toUpperCase(),
        review_rating: reviewRating,
        finalized_at: new Date().toISOString(),
        distribution_status: schemeId
          ? (isChf ? "waiting_funds" : "pending_fx")
          : "distributed",
      })
      .select("id")
      .single();

    if (error) {
      console.error("❌ Failed to create tip:", error);
      return;
    }

    tipId = tip.id;
  }

  // ----------------------------------------------------
  // No scheme → direct tip (unchanged)
  // ----------------------------------------------------
  if (!schemeId || !employerId) {
    return;
  }

  // ----------------------------------------------------
  // FX PAYMENT → DO NOT DISTRIBUTE NOW
  // ----------------------------------------------------

  if (!isChf) {
    await supabaseAdmin
      .from("tips")
      .update({
        distribution_status: "pending_fx",
        distribution_error: null,

        // 🆕 retry-поля
        fx_retry_count: 0,
        fx_next_retry_at: new Date(Date.now() + 60_000).toISOString(), // +1 минута
      })
      .eq("id", tipId);

    console.log("🟦 FX payment queued:", intent.currency, intent.amount);
    return;
  }

  // CHF → DISTRIBUTE IMMEDIATELY (existing logic)

  // 1️⃣ достаём charge из PaymentIntent
  const intentFull = await stripe.paymentIntents.retrieve(intent.id, {
    expand: ["latest_charge"],
  });
  const charge: any = intentFull.latest_charge;

  if (!charge?.id) {
    await supabaseAdmin
      .from("tips")
      .update({
        distribution_status: "failed",
        distribution_error: "No latest_charge on payment intent",
      })
      .eq("id", tipId);
    return;
  }

  // 2️⃣ передаём charge.id дальше
  await distributeSchemeChfImmediate({
    tipId,
    schemeId,
    employerId,
    sourceChargeId: charge.id,
    paymentIntentId: intent.id, // 🟢 ВАЖНО
  });

}

async function handleTransferCreated(transfer: Stripe.Transfer) {
  const supabaseAdmin = getSupabaseAdmin();

  // 0) Дотягиваем transfer с expand, чтобы понять связь с платежом
  let full: Stripe.Transfer;
  try {
    full = await stripe.transfers.retrieve(transfer.id, {
      expand: ["source_transaction", "destination_payment"],
    });
  } catch (e) {
    console.error("❌ Failed to retrieve transfer:", transfer.id, e);
    return;
  }

  // 1) Пытаемся достать payment_intent_id из связанных объектов
  let paymentIntentId: string | null = null;

  const st: any = (full as any).source_transaction;
  const dp: any = (full as any).destination_payment;

  // 1a) source_transaction как объект (часто Charge)
  if (st && typeof st === "object" && st.payment_intent) {
    paymentIntentId = st.payment_intent as string;
  }

  // 1b) destination_payment как объект (тоже часто Charge)
  if (!paymentIntentId && dp && typeof dp === "object" && dp.payment_intent) {
    paymentIntentId = dp.payment_intent as string;
  }

  // 1c) Если source_transaction пришёл строкой ch_... — достаём charge вручную
  if (!paymentIntentId && typeof full.source_transaction === "string") {
    const id = full.source_transaction;

    if (id.startsWith("ch_")) {
      try {
        const charge = await stripe.charges.retrieve(id);
        if (charge.payment_intent) {
          paymentIntentId = charge.payment_intent as string;
        }
      } catch (e) {
        console.error("❌ Failed to retrieve charge for transfer:", full.id, id, e);
      }
    }
  }

  // 2) Если всё равно не нашли PI — просто выходим (ничего не ломаем)
  if (!paymentIntentId) {
    // Это может быть ручной transfer или "не из нашего флоу"
    console.log("⚠️ No payment_intent found for transfer:", full.id);
    return;
  }

  // 3) Получаем tip по payment_intent_id
  const { data: tip } = await supabaseAdmin
    .from("tips")
    .select("id, scheme_id, stripe_transfer_id")
    .eq("payment_intent_id", paymentIntentId)
    .maybeSingle();

  if (!tip) {
    // Tip ещё не создан (бывает из-за порядка вебхуков)
    console.log("⚠️ Tip not found yet for payment_intent:", paymentIntentId, "transfer:", full.id);
    return;
  }

  // 4) Если это tip по схеме — ничего не делаем (как у тебя и задумано)
  if (tip.scheme_id) {
    return;
  }

  // 5) Idempotency: если уже записан transfer — выходим
  if (tip.stripe_transfer_id) {
    return;
  }

  // 6) DIRECT TIP → сохраняем transfer в tips
  await supabaseAdmin
    .from("tips")
    .update({
      stripe_transfer_id: full.id,
    })
    .eq("id", tip.id);
}



// ===================================================================
// CHF DISTRIBUTION (IMMEDIATE, AS BEFORE)
// ===================================================================

async function distributeSchemeChfImmediate(args: {
  tipId: string;
  schemeId: string;
  employerId: string;
  sourceChargeId: string;
  paymentIntentId: string;
}) {
  const { tipId, schemeId, employerId, sourceChargeId, paymentIntentId } = args;
  const supabaseAdmin = getSupabaseAdmin();

  await supabaseAdmin
  .from("tips")
  .update({
    distribution_status: "distributing",
    distribution_error: null,
  })
  .eq("id", tipId);

  const { data: tipRow } = await supabaseAdmin
    .from("tips")
    .select("amount_net_cents, currency")
    .eq("id", tipId)
    .single();

    if (!tipRow) {
      await supabaseAdmin
        .from("tips")
        .update({
          distribution_status: "failed",
          distribution_error: "Tip not found",
        })
        .eq("id", tipId);
      return;
    }

    const distributable = tipRow.amount_net_cents;
    const currency = tipRow.currency.toLowerCase();

  const { data: parts } = await supabaseAdmin
    .from("allocation_scheme_parts")
    .select("*")
    .eq("scheme_id", schemeId)
    .order("part_index");

  if (!parts || parts.length === 0) {
    await supabaseAdmin
      .from("tips")
      .update({
        distribution_status: "failed",
        distribution_error: "Scheme has no parts",
      })
      .eq("id", tipId);
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

      const destinationId: string = part.destination_id;

      const { data: worker } = await supabaseAdmin
        .from("profiles_earner")
        .select("stripe_account_id")
        .eq("id", destinationId)
        .maybeSingle();

      if (!worker?.stripe_account_id) {
        allSucceeded = false;
        continue;
      }

      await supabaseAdmin.from("tip_splits").upsert(
        {
          tip_id: tipId,
          part_index: part.part_index,
          label: part.label,
          percent: part.percent,
          amount_cents: amountForPart,
          destination_kind: "earner",
          destination_id: part.destination_id,
          stripe_transfer_id: null,
          payment_intent_id: paymentIntentId,
          status: "planned",
          error_message: null,
        },
        { onConflict: "tip_id,part_index" }
      );

      const ok = await createSplitSafe({
    
        tipId,
        paymentIntentId,
        part,
        amountCents: amountForPart,
        currency,
        destinationAccountId: worker.stripe_account_id,
        destinationKind: "earner",
        destinationId: part.destination_id,
        sourceChargeId,
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

      await supabaseAdmin.from("tip_splits").upsert(
        {
          tip_id: tipId,
          part_index: part.part_index,
          label: part.label,
          percent: part.percent,
          amount_cents: amountForPart,
          destination_kind: "employer",
          destination_id: employerId,
          payment_intent_id: paymentIntentId,
          stripe_transfer_id: null,
          status: "planned",
          error_message: null,
        },
        { onConflict: "tip_id,part_index" }
      );

      const ok = await createSplitSafe({
        tipId,
        paymentIntentId,
        part,
        amountCents: amountForPart,
        currency,
        destinationAccountId: emp.stripe_account_id,
        destinationKind: "employer",
        destinationId: employerId,
        sourceChargeId,
      });

      if (!ok) allSucceeded = false;
    }
  }

  await supabaseAdmin
    .from("tips")
    .update({
      distribution_status: allSucceeded ? "distributed" : "partially_failed",
      distribution_error: allSucceeded ? null : "CHF distribution partially failed",
    })
    .eq("id", tipId);
}

// ===================================================================
// FX BATCH PROCESSOR (balance.available trigger)
// ===================================================================

async function processPendingFxBatch() {
  const BATCH_SIZE = 25;
  const supabaseAdmin = getSupabaseAdmin();
  const { data: tips } = await supabaseAdmin
    .from("tips")
    .select("id, payment_intent_id, scheme_id, employer_id")
    .eq("distribution_status", "pending_fx")
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (!tips || tips.length === 0) return;

  for (const tip of tips) {
    try {
      if (!tip.payment_intent_id) {
        continue;
      }

      const paymentIntentId: string = tip.payment_intent_id;

      const intent = await stripe.paymentIntents.retrieve(
        paymentIntentId,
        { expand: ["latest_charge"] }
      );

      const charge: any = intent.latest_charge;
      if (!charge?.balance_transaction) continue;

      const bt = await stripe.balanceTransactions.retrieve(
        charge.balance_transaction
      );

      if ((bt.currency || "").toLowerCase() !== "chf") {
        await supabaseAdmin
          .from("tips")
          .update({
            distribution_status: "failed",
            distribution_error: "Unexpected settlement currency",
          })
          .eq("id", tip.id);
        continue;
      }

      await supabaseAdmin
        .from("tips")
        .update({
          stripe_charge_id: charge.id,
          stripe_balance_txn_id: charge.balance_transaction,
          settlement_gross_cents: bt.amount,
          settlement_net_cents: bt.net,
          distribution_status: "waiting_funds",
        })
        .eq("id", tip.id);

      await distributeSchemeFxChf({
        tipId: tip.id,
        schemeId: tip.scheme_id,
        employerId: tip.employer_id,
        settlementGrossCents: bt.amount,
        settlementNetCents: bt.net,
        paymentIntentId,
      });
    } catch (e: any) {
      await supabaseAdmin
        .from("tips")
        .update({
          distribution_status: "failed",
          distribution_error: e?.message ?? "FX batch error",
        })
        .eq("id", tip.id);
    }
  }
}

// ===================================================================
// FX DISTRIBUTION IN CHF
// ===================================================================

async function distributeSchemeFxChf(args: {
  tipId: string;
  schemeId: string | null;
  employerId: string | null;
  settlementGrossCents: number;
  settlementNetCents: number;
  paymentIntentId: string;
}) {
  const supabaseAdmin = getSupabaseAdmin(); 
  const { tipId, schemeId, employerId, settlementGrossCents, settlementNetCents, paymentIntentId } = args;

  // 🟢 FX: достаём sourceChargeId из tips
  const { data: tipRow } = await supabaseAdmin
    .from("tips")
    .select("stripe_charge_id")
    .eq("id", tipId)
    .single();

  if (!tipRow?.stripe_charge_id) {
    await supabaseAdmin
      .from("tips")
      .update({
        distribution_status: "failed",
        distribution_error: "Missing stripe_charge_id for FX distribution",
      })
      .eq("id", tipId);
    return;
  }

  const sourceChargeId = tipRow.stripe_charge_id;

  if (!schemeId || !employerId) {
    await supabaseAdmin
      .from("tips")
      .update({
        distribution_status: "failed",
        distribution_error: "Missing schemeId or employerId in FX distribution",
      })
      .eq("id", tipId);
    return;
  }

  await supabaseAdmin
    .from("tips")
    .update({
      distribution_status: "distributing",
      distribution_error: null,
    })
    .eq("id", tipId);
  
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

  if (!parts || parts.length === 0) return;

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

      const destinationId: string = part.destination_id;

      const { data: worker } = await supabaseAdmin
        .from("profiles_earner")
        .select("stripe_account_id")
        .eq("id", destinationId)
        .maybeSingle();

      if (!worker?.stripe_account_id) {
        allSucceeded = false;
        continue;
      }

      await supabaseAdmin.from("tip_splits").upsert(
        {
          tip_id: tipId,
          part_index: part.part_index,
          label: part.label,
          percent: part.percent,
          amount_cents: amountForPart,
          destination_kind: "earner",
          destination_id: part.destination_id,
          stripe_transfer_id: null,
          payment_intent_id: paymentIntentId,
          status: "planned",
          error_message: null,
        },
        { onConflict: "tip_id,part_index" }
      );

      const ok = await createSplitSafe({
        tipId,
        part,
        paymentIntentId,
        amountCents: amountForPart,
        currency: "chf",
        destinationAccountId: worker.stripe_account_id,
        destinationKind: "earner",
        destinationId: part.destination_id,
        sourceChargeId,
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

      await supabaseAdmin.from("tip_splits").upsert(
        {
          tip_id: tipId,
          part_index: part.part_index,
          label: part.label,
          percent: part.percent,
          amount_cents: amountForPart,
          destination_kind: "employer",
          destination_id: employerId,
          stripe_transfer_id: null,
          payment_intent_id: paymentIntentId,
          status: "planned",
          error_message: null,
        },
        { onConflict: "tip_id,part_index" }
      );

      const ok = await createSplitSafe({
        tipId,
        part,
        amountCents: amountForPart,
        paymentIntentId,
        currency: "chf",
        destinationAccountId: emp.stripe_account_id,
        destinationKind: "employer",
        destinationId: employerId,
        sourceChargeId,
      });

      if (!ok) allSucceeded = false;
    }
  }

  await supabaseAdmin
    .from("tips")
    .update({
    distribution_status: allSucceeded ? "distributed" : "partially_failed",
    distribution_error: allSucceeded ? null : "FX distribution partially failed",
    })
    .eq("id", tipId);
}

// ===================================================================
// SAFE SPLIT CREATION (IDEMPOTENT)
// ===================================================================

async function createSplitSafe({
  tipId,
  paymentIntentId,
  part,
  amountCents,
  currency,
  destinationAccountId,
  destinationKind,
  destinationId,
  sourceChargeId,
}: {
  tipId: string;
  paymentIntentId: string;
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
    const transfer = await stripe.transfers.create({
      amount: amountCents,
      currency,
      destination: destinationAccountId,
      transfer_group: `scheme_${part.scheme_id}`,
      source_transaction: sourceChargeId, // 🟢 КЛЮЧЕВАЯ СТРОКА
    });

    // ✅ 4. SUCCESS split
    await supabaseAdmin.from("tip_splits").upsert(
      {
        tip_id: tipId,
        part_index: part.part_index,
        payment_intent_id: paymentIntentId,
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
        payment_intent_id: paymentIntentId,
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
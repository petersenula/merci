import Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

const stripe = new Stripe(stripeSecretKey);

export async function distributeSchemeImmediate(args: {
  tipId: string;
  schemeId: string;
  employerId: string;
  sourceChargeId: string;
  paymentIntentId: string;
  markDistributing?: boolean;
}) {
  const {
    tipId,
    schemeId,
    employerId,
    sourceChargeId,
    paymentIntentId,
    markDistributing = true,
  } = args;

  const supabaseAdmin = getSupabaseAdmin();

  if (markDistributing) {
    await supabaseAdmin
      .from("tips")
      .update({
        distribution_status: "distributing",
        distribution_error: null,
      })
      .eq("id", tipId);
  }

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

  let parts: any[] | null = null;

  const { data: snapshot, error: snapshotError } = await supabaseAdmin
    .from("payment_scheme_snapshots")
    .select("parts")
    .eq("payment_intent_id", paymentIntentId)
    .maybeSingle();

  if (snapshotError) {
    console.error("Scheme snapshot load failed:", snapshotError);
  }

  if (snapshot && Array.isArray(snapshot.parts) && snapshot.parts.length > 0) {
    parts = [...snapshot.parts].sort(
      (a: any, b: any) => Number(a.part_index) - Number(b.part_index)
    );
  } else {
    console.warn(
      "⚠️ No scheme snapshot for PaymentIntent; using legacy live scheme:",
      paymentIntentId
    );

    const { data: legacyParts, error: legacyPartsError } = await supabaseAdmin
      .from("allocation_scheme_parts")
      .select("*")
      .eq("scheme_id", schemeId)
      .order("part_index");

    if (legacyPartsError) {
      console.error("Legacy scheme parts load failed:", legacyPartsError);
    }

    parts = legacyParts;
  }

  if (!parts || parts.length === 0) {
    await supabaseAdmin
      .from("tips")
      .update({
        distribution_status: "failed",
        distribution_error: "Scheme has no parts or snapshot",
      })
      .eq("id", tipId);
    return;
  }

  let allSucceeded = true;
  let remaining = distributable;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const isLast = i === parts.length - 1;

    const { data: existingSplit } = await supabaseAdmin
      .from("tip_splits")
      .select("status, stripe_transfer_id")
      .eq("tip_id", tipId)
      .eq("part_index", part.part_index)
      .maybeSingle();

    if (
      existingSplit?.status === "succeeded" &&
      existingSplit.stripe_transfer_id
    ) {
      const amountForExistingPart = Math.max(
        Math.floor(distributable * (part.percent / 100)),
        0
      );

      remaining -= isLast ? remaining : amountForExistingPart;
      continue;
    }

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
            status: "failed",
            error_message: "Recipient has no Stripe account",
          },
          { onConflict: "tip_id,part_index" }
        );

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
            status: "failed",
            error_message: "Recipient has no Stripe account",
          },
          { onConflict: "tip_id,part_index" }
        );

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
      distribution_error: allSucceeded ? null : "Scheme distribution partially failed",
    })
    .eq("id", tipId);
}

export async function createSplitSafe({
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

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_LEDGER_WEBHOOK_SECRET!;

function formatDateUTC(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function POST(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("Missing signature", { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error("❌ Invalid signature:", err.message);
    return new NextResponse(`Webhook error: ${err.message}`, { status: 400 });
  }

  if (event.type !== "balance.available") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const stripeAccountId = event.account;
  if (!stripeAccountId) {
    console.log("❗ No account in event");
    return NextResponse.json({ ok: true });
  }

  // ======================================================
  // 1. Determine account
  // ======================================================
  let accountType: "earner" | "employer" | null = null;
  let accountId: string | null = null;
  let accountCurrency: string | null = null;

  {
    const { data } = await supabaseAdmin
      .from("profiles_earner")
      .select("id, currency")
      .eq("stripe_account_id", stripeAccountId)
      .limit(1);

    if (data?.length) {
      accountType = "earner";
      accountId = data[0].id;
      accountCurrency = data[0].currency;
    }
  }

  if (!accountId) {
    const { data } = await supabaseAdmin
      .from("employers")
      .select("user_id, currency")
      .eq("stripe_account_id", stripeAccountId)
      .limit(1);

    if (data?.length) {
      accountType = "employer";
      accountId = data[0].user_id;
      accountCurrency = data[0].currency;
    }
  }

  if (!accountId || !accountType) {
    console.log("❗ Unknown Stripe account → skipping");
    return NextResponse.json({ ok: true });
  }

  // ⬇️ type narrowing для TypeScript
  const safeAccountId: string = accountId;
  const safeAccountType: "earner" | "employer" = accountType;
  const safeCurrency: string = accountCurrency ?? "EUR";

  // ======================================================
  // 2. Get CURRENT Stripe balance
  // ======================================================
  const stripeBalance = await stripe.balance.retrieve(
    {},
    { stripeAccount: stripeAccountId }
  );
  const currentBalance = stripeBalance.available[0]?.amount ?? 0;

  // ======================================================
  // 3. Load ALL balance transactions
  // ======================================================
  const txns = await stripe.balanceTransactions.list(
    { limit: 100 },
    { stripeAccount: stripeAccountId }
  );

  console.log("🔍 Stripe balance txns:", txns.data.length);

  // ======================================================
  // 4. Write transactions + entries
  // ======================================================
  for (const t of txns.data) {
    const txnDate = formatDateUTC(new Date(t.created * 1000));

    const balanceAfterValue = currentBalance;

    // ================================================
    // 🆕 FIX 1 — вычисляем stripeFee корректно
    // ================================================
    const stripeFee =
      t.fee_details?.reduce((sum, f) => sum + f.amount, 0) ?? 0;

    // ledger_transactions
    const { error: txnErr } = await supabaseAdmin
      .from("ledger_transactions")
      .upsert(
        {
          stripe_balance_transaction_id: t.id,
          earner_id: accountType === "earner" ? accountId : null,
          employer_id: accountType === "employer" ? accountId : null,
          stripe_object_id:
            typeof t.source === "string"
              ? t.source
              : t.source?.id ?? null,
          operation_type: t.type,
          reporting_category: t.reporting_category,
          currency: t.currency.toUpperCase(),
          amount_gross_cents: t.amount, // full gross
          net_cents: t.net, // already gross - stripeFee
          balance_after: balanceAfterValue,
          created_at: new Date(t.created * 1000).toISOString(),
          raw: null,
        },
        { onConflict: "stripe_balance_transaction_id" }
      );

    if (txnErr) console.error("TXN UPSERT ERROR:", txnErr);

    // ================================================
    // 🆕 FIX 2 — ledger_entries must store NET = gross - stripeFee
    // ================================================
    await supabaseAdmin.from("ledger_entries").upsert(
      {
        date: txnDate,
        account_id: accountId,
        account_type: accountType,
        stripe_txn_id: t.id,
        type: t.type,
        amount_cents: t.net, // (gross - stripeFee)
        currency: t.currency.toUpperCase(),
        source_id:
          typeof t.source === "string"
            ? t.source
            : t.source?.id ?? null,
              },
              { onConflict: "stripe_txn_id" }
            );
    // ------------------------------------------------------
    // 🔄 HANDLE TRANSFER REVERSAL — write to CLIENT LEDGER
    // ------------------------------------------------------
    if (t.reporting_category === "transfer_reversal") {
      console.log("🔄 Transfer reversal detected:", t.id);

      const originalTransferId =
        typeof t.source === "string"
          ? t.source
          : t.source?.id ?? null;

      if (originalTransferId) {
        const { data: split } = await supabaseAdmin
          .from("tip_splits")
          .select("destination_kind, destination_id, amount_cents")
          .eq("stripe_transfer_id", originalTransferId)
          .maybeSingle();

        if (split) {
          const reversalDate = formatDateUTC(new Date(t.created * 1000));

          await supabaseAdmin.from("ledger_entries").upsert(
            {
              date: reversalDate,
              account_id: split.destination_id,
              account_type: split.destination_kind,
              stripe_txn_id: t.id,
              type: "transfer_reversal",
              amount_cents: -Math.abs(split.amount_cents),
              currency: t.currency.toUpperCase(),
              source_id: originalTransferId,
            },
            { onConflict: "stripe_txn_id" }
          );

          console.log("🟢 Client ledger reversal recorded for", {
            accountType: split.destination_kind,
            accountId: split.destination_id,
          });
        }
      }
    }
  }

  // ======================================================
  // 5. Load or CREATE ledger_balances
  // ======================================================
  const todayUTC = formatDateUTC(new Date());

  const { data: todayRows } = await supabaseAdmin
    .from("ledger_balances")
    .select("*")
    .eq("date", todayUTC)
    .eq("account_id", accountId)
    .eq("account_type", accountType)
    .limit(1);

  let row = todayRows?.[0];

  if (!row) {
    console.log("🆕 Creating today's ledger_balances");

    const { error: insertErr } = await supabaseAdmin
      .from("ledger_balances")
      .insert({
        date: todayUTC,
        account_id: safeAccountId,
        account_type: safeAccountType,
        currency: safeCurrency,
        balance_start_cents: 0,
        balance_end_cents: currentBalance,
      });

    if (insertErr) {
      console.error("❌ Failed to insert first ledger_balances:", insertErr);
      return NextResponse.json({ error: true });
    }

    const { data: newRows } = await supabaseAdmin
      .from("ledger_balances")
      .select("*")
      .eq("date", todayUTC)
      .eq("account_id", accountId)
      .eq("account_type", accountType)
      .limit(1);

    row = newRows?.[0];
  }

  if (!row) {
    console.error("❌ Ledger row not found after insert");
    return NextResponse.json({ error: true });
  }

  // ======================================================
  // 6. Compute expected balance
  // ======================================================
  const { data: entries } = await supabaseAdmin
    .from("ledger_entries")
    .select("amount_cents")
    .eq("account_id", accountId)
    .eq("account_type", accountType)
    .eq("date", todayUTC);

  const totalNetToday =
    entries?.reduce((sum, e) => sum + e.amount_cents, 0) ?? 0;

  const expectedBalance = row.balance_start_cents + totalNetToday;

  // ======================================================
  // 7. Correct mismatch
  // ======================================================
  if (expectedBalance !== currentBalance) {
    await supabaseAdmin
      .from("ledger_balances")
      .update({ balance_end_cents: currentBalance })
      .eq("id", row.id);

    return NextResponse.json({
      ok: true,
      corrected: true,
      expectedBalance,
      stripeBalance: currentBalance,
    });
  }

  // ======================================================
  // 8. Match OK
  // ======================================================
  await supabaseAdmin
    .from("ledger_balances")
    .update({ balance_end_cents: currentBalance })
    .eq("id", row.id);

  return NextResponse.json({ ok: true, matched: true });
}

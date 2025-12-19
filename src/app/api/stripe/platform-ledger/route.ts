import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const webhookSecret = process.env.STRIPE_PLATFORM_LEDGER_SECRET!;

// YYYY-MM-DD UTC
function formatDateUTC(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function POST(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig!, webhookSecret);
  } catch (err: any) {
    console.error("❌ Bad signature:", err.message);
    return new NextResponse(`Webhook error: ${err.message}`, { status: 400 });
  }

  if (event.type !== "balance.available") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  console.log("🔔 PLATFORM ledger webhook");

  // 1. Platform balance
  const balance = await stripe.balance.retrieve();
  const currentBalance = balance.available[0]?.amount ?? 0;

  // 2. Last 100 balance transactions
  const txns = await stripe.balanceTransactions.list({
    limit: 100,
  });

  console.log("🔍 PLATFORM txns:", txns.data.length);

  for (const t of txns.data) {
    const date = formatDateUTC(new Date(t.created * 1000));

    // ------------------------------
    // A) Считаем комиссию Stripe из fee_details
    // ------------------------------
    let stripeFee =
      t.fee_details?.reduce((sum, f) => sum + f.amount, 0) ?? 0;

    // ------------------------------
    // B) Если Stripe fee = 0, а должно быть — качаем charge
    // ------------------------------
    if (
      !stripeFee &&
      typeof t.source !== "string" &&
      t.source?.object === "charge"
      ) {
      try {
          const charge = await stripe.charges.retrieve(t.source.id);

          const detailsFee =
            typeof charge.balance_transaction !== "string" &&
            charge.balance_transaction?.fee_details
              ? charge.balance_transaction.fee_details.reduce(
                  (sum, f) => sum + f.amount,
                  0
                )
              : 0;


          if (detailsFee) {
          console.log("🟡 Fee fallback from charge:", detailsFee);
          stripeFee = detailsFee;
          }
      } catch (err) {
          console.error("⚠ Error pulling charge for fee fallback:", err);
      }
    }

    // ------------------------------
    // C) Application fee (platform)
    // ------------------------------
    let applicationFee = 0;

    const paymentIntentId =
      t.source &&
      typeof t.source !== "string" &&
      t.source.object === "charge"
        ? t.source.payment_intent
        : null;

    if (paymentIntentId) {
      try {
        const pi = await stripe.paymentIntents.retrieve(paymentIntentId as string);
        if (pi.application_fee_amount) {
          applicationFee = pi.application_fee_amount;
        }
      } catch (err) {
        console.error("⚠ Error pulling payment intent fee:", err);
      }
    }

    // ------------------------------
    // D) Write ledger_platform_transactions
    // ------------------------------
    await supabaseAdmin.from("ledger_platform_transactions").upsert(
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
        raw: JSON.parse(JSON.stringify(t)),
      },
      { onConflict: "stripe_balance_transaction_id" }
    );
  }

  // ------------------------------
  // 3. Update platform daily balance
  // ------------------------------
  const today = formatDateUTC(new Date());

  const { data: rows } = await supabaseAdmin
    .from("ledger_platform_balances")
    .select("*")
    .eq("date", today)
    .limit(1);

  const row = rows?.[0];

  if (!row) {
    await supabaseAdmin.from("ledger_platform_balances").insert({
      date: today,
      balance_start_cents: currentBalance,
      balance_end_cents: currentBalance,
      currency: "CHF",
      created_at: new Date().toISOString(),
    });
  } else {
    await supabaseAdmin
      .from("ledger_platform_balances")
      .update({ balance_end_cents: currentBalance })
      .eq("id", row.id);
  }

  return NextResponse.json({ ok: true });
}

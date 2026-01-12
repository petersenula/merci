// src/app/api/employers/reports/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// -----------------------------------
// PERIOD TYPE
// -----------------------------------
type Period =
  | "today"
  | "yesterday"
  | "week"
  | "month"
  | "last_month"
  | "year"
  | "last_year"
  | "custom";

// -----------------------------------
// DATE RANGE (old presets support)
// — КОПИЯ из роутера работников
// -----------------------------------
function getPeriodRange(
  period: Period,
  fromParam?: string | null,
  toParam?: string | null,
  value?: string | null
) {
  const now = new Date();

  const startOfDay = (d: Date) =>
    new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));

  const endOfDay = (d: Date) =>
    new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59));

  let from: Date, to: Date;

  switch (period) {
    case "today":
      from = startOfDay(now);
      to = endOfDay(now);
      break;

    case "yesterday": {
      const y = new Date(now);
      y.setUTCDate(y.getUTCDate() - 1);
      from = startOfDay(y);
      to = endOfDay(y);
      break;
    }

    case "week": {
      if (value) {
        const [yearStr, weekStr] = value.split("-W");
        const year = Number(yearStr);
        const week = Number(weekStr);

        function isoWeekStart(yr: number, wk: number) {
          const simple = new Date(Date.UTC(yr, 0, 1 + (wk - 1) * 7));
          const dow = simple.getUTCDay();
          const ISOweekStart = new Date(simple);

          if (dow <= 4) {
            ISOweekStart.setUTCDate(simple.getUTCDate() - dow + 1);
          } else {
            ISOweekStart.setUTCDate(simple.getUTCDate() + 8 - dow);
          }

          return ISOweekStart;
        }

        const start = isoWeekStart(year, week);
        from = start;
        to = new Date(
          Date.UTC(
            start.getUTCFullYear(),
            start.getUTCMonth(),
            start.getUTCDate() + 6,
            0,
            0,
            0
          )
        );
      } else {
        const w = new Date(now);
        w.setUTCDate(w.getUTCDate() - 7);
        from = startOfDay(w);
        to = endOfDay(now);
      }
      break;
    }

    case "month": {
      if (value) {
        const [yearStr, monthStr] = value.split("-");
        const year = Number(yearStr);
        const month = Number(monthStr);

        from = new Date(Date.UTC(year, month - 1, 1));
        to = new Date(Date.UTC(year, month, 0, 0, 0, 0));
      } else {
        from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        to = new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59)
        );
      }
      break;
    }

    case "last_month": {
      const year = now.getUTCFullYear();
      const month = now.getUTCMonth() - 1;

      const prevYear = month < 0 ? year - 1 : year;
      const normalized = (month + 12) % 12;

      from = new Date(Date.UTC(prevYear, normalized, 1));
      to = new Date(Date.UTC(prevYear, normalized + 1, 0, 23, 59, 59));
      break;
    }

    case "year":
      from = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
      to = new Date(Date.UTC(now.getUTCFullYear(), 11, 31, 23, 59, 59));
      break;

    case "last_year": {
      const ly = now.getUTCFullYear() - 1;
      from = new Date(Date.UTC(ly, 0, 1));
      to = new Date(Date.UTC(ly, 11, 31, 23, 59, 59));
      break;
    }

    case "custom": {
      const [fy, fm, fd] = fromParam!.split("-").map(Number);
      const [ty, tm, td] = toParam!.split("-").map(Number);
      from = new Date(Date.UTC(fy, fm - 1, fd));
      to = new Date(Date.UTC(ty, tm - 1, td, 23, 59, 59));
      break;
    }
  }

  return {
    fromTs: Math.floor(from.getTime() / 1000),
    toTs: Math.floor(to.getTime() / 1000),
    fromDate: from,
    toDate: to,
  };
}

// -----------------------------------
// MAIN HANDLER (EMPLOYERS)
// -----------------------------------
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: { Authorization: req.headers.get("authorization") ?? "" },
        },
        auth: { persistSession: false, autoRefreshToken: false },
      }
    );

    // AUTH
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    type EmployerRow = Database["public"]["Tables"]["employers"]["Row"];

    const { data: employer } = await supabase
      .from("employers")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    const employerTyped = employer as EmployerRow | null;

    if (!employerTyped) {
      return NextResponse.json(
        { error: "Employer profile not found" },
        { status: 404 }
      );
    }

    const stripeAccountId = employerTyped.stripe_account_id;

    if (!stripeAccountId) {
      return NextResponse.json(
        { error: "Stripe not connected" },
        { status: 400 }
      );
    }

    if (!employerTyped.currency) {
      return NextResponse.json(
        { error: "Employer currency not set" },
        { status: 400 }
      );
    }

    const currency = employerTyped.currency.toLowerCase();

    // QUERY PARAMS
    const url = new URL(req.url);

    const period = url.searchParams.get("period");
    const value = url.searchParams.get("value");
    const fromParam = url.searchParams.get("from");
    const toParam = url.searchParams.get("to");

    let fromTs: number;
    let toTs: number;
    let fromDate: Date;
    let toDate: Date;

    // NEW FORMAT: month + value
    if (period === "month" && value) {
      const [year, month] = value.split("-").map(Number);

      fromDate = new Date(Date.UTC(year, month - 1, 1));
      toDate = new Date(Date.UTC(year, month, 0, 0, 0, 0));

      fromTs = Math.floor(fromDate.getTime() / 1000);
      toTs = Math.floor(toDate.getTime() / 1000);
    }

    // NEW FORMAT: week + value
    else if (period === "week" && value) {
      const [yearStr, weekStr] = value.split("-W");
      const year = Number(yearStr);
      const week = Number(weekStr);

      const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
      const dow = simple.getUTCDay();
      const ISOweekStart =
        dow <= 4
          ? new Date(simple.setUTCDate(simple.getUTCDate() - dow + 1))
          : new Date(simple.setUTCDate(simple.getUTCDate() + 8 - dow));

      fromDate = ISOweekStart;

      toDate = new Date(
        Date.UTC(
          fromDate.getUTCFullYear(),
          fromDate.getUTCMonth(),
          fromDate.getUTCDate() + 6,
          0,
          0,
          0
        )
      );

      fromTs = Math.floor(fromDate.getTime() / 1000);
      toTs = Math.floor(toDate.getTime() / 1000);
    }

    // CUSTOM
    else if (fromParam && toParam) {
      const [fy, fm, fd] = fromParam.split("-").map(Number);
      const [ty, tm, td] = toParam.split("-").map(Number);

      fromDate = new Date(Date.UTC(fy, fm - 1, fd));
      toDate = new Date(Date.UTC(ty, tm - 1, td, 23, 59, 59));

      fromTs = Math.floor(fromDate.getTime() / 1000);
      toTs = Math.floor(toDate.getTime() / 1000);
    }

    // OLD PRESETS
    else {
      const legacy = getPeriodRange(
        (period as Period) || "month",
        fromParam,
        toParam,
        value
      );

      fromTs = legacy.fromTs;
      toTs = legacy.toTs;
      fromDate = legacy.fromDate;
      toDate = legacy.toDate;
    }

    // STRIPE CHARGES
    const charges = await stripe.charges.list(
      { created: { gte: fromTs, lte: toTs }, limit: 200 },
      { stripeAccount: stripeAccountId }
    );

    // STRIPE TRANSFERS (scheme payments)
    // ⚠️ Важно: transfer (tr_...) обычно создаётся на платформе,
    // поэтому листаем transfers БЕЗ stripeAccount, но фильтруем по destination.
    const transfers = await stripe.transfers.list({
      created: { gte: fromTs, lte: toTs },
      destination: stripeAccountId,
      limit: 200,
    });

    // DEBUG: что реально пришло из Stripe
    console.log("🧾 STRIPE TRANSFERS RAW:", transfers.data.map(t => ({
      id: t.id,                    // tr_...
      amount: t.amount,
      currency: t.currency,
      created: t.created,
      destination: t.destination,  // должен быть acct_...
      transfer_group: t.transfer_group ?? null,
      source_transaction: (t as any).source_transaction ?? null,
      description: t.description ?? null,
    })));

    // -----------------------------------
    // LOAD RATINGS FROM SUPABASE
    // - direct payments: tips.payment_intent_id -> tips.review_rating
    // - scheme payments: tip_splits.stripe_transfer_id -> tip_splits.review_rating
    // -----------------------------------
    const paymentIntentIds = charges.data
      .map(c => c.payment_intent)
      .filter((id): id is string => typeof id === "string");

    const transferIds = transfers.data.map(t => t.id);

   
    // 1) ratings for direct payments (tips)
    // Берём rating по payment_intent_id (pi_...) без фильтра employer_id,
    // потому что Stripe-операции уже ограничены stripeAccountId работодателя.
    // DIRECT RATINGS: pi_... → tips.review_rating
    const { data: tipsData } = paymentIntentIds.length
      ? await supabase
          .from("tips")
          .select("payment_intent_id, review_rating")
          .in("payment_intent_id", paymentIntentIds)
      : { data: [] as any[] };

    const ratingByPaymentIntent = new Map<string, number>();

    (tipsData ?? []).forEach((t) => {
      if (
        t.payment_intent_id &&
        t.review_rating !== null &&
        t.review_rating !== undefined
      ) {
        ratingByPaymentIntent.set(t.payment_intent_id, t.review_rating);
      }
    });

    // 2) ratings for scheme payments (tip_splits)
    const { data: splitsData } = transferIds.length
      ? await supabase
          .from("tip_splits")
          .select("stripe_transfer_id, review_rating")
          .in("stripe_transfer_id", transferIds)
      : { data: [] as any[] };

      const ratingByTransferId = new Map<string, number>();

      (splitsData ?? []).forEach((s) => {
        if (
          s.stripe_transfer_id &&
          s.review_rating !== null &&
          s.review_rating !== undefined
        ) {
          ratingByTransferId.set(s.stripe_transfer_id, s.review_rating);
        }
      });

    console.log("⭐ RATINGS DEBUG", {
      paymentIntentIdsCount: paymentIntentIds.length,
      transferIdsCount: transferIds.length,
      directRatingsFound: ratingByPaymentIntent.size,
      schemeRatingsFound: ratingByTransferId.size,
    });

    // STRIPE PAYOUTS
    const payouts = await stripe.payouts.list(
      { arrival_date: { gte: fromTs, lte: toTs }, limit: 200 },
      { stripeAccount: stripeAccountId }
    );

    // ENRICH WITH NET + FEE
    const chargesWithNet = await Promise.all(
      charges.data.map(async (c) => {
        const bt = await stripe.balanceTransactions.retrieve(
          c.balance_transaction as string,
          undefined,
          { stripeAccount: stripeAccountId }
        );
        let review_rating: number | null = null;

        if (typeof c.payment_intent === "string") {
          review_rating = ratingByPaymentIntent.get(c.payment_intent) ?? null;
        }
        return {
          id: c.id,
          stripe_payment_intent_id: c.payment_intent, // pi_...
          created: c.created,
          available_on: bt.available_on,
          type: "charge" as const,
          gross: c.amount,
          net: bt.net,
          fee: bt.fee,
          currency: c.currency,
          description: c.description ?? null,
          direction: "in" as const,
          review_rating:
            typeof c.payment_intent === "string"
              ? ratingByPaymentIntent.get(c.payment_intent) ?? null
              : null,
        };
      })
    );

    const transfersWithRating = transfers.data.map((t) => {
      return {
        id: t.id,
        stripe_transfer_id: t.id,
        created: t.created,
        available_on: t.created,
        type: "transfer" as const,
        gross: t.amount,
        net: t.amount,
        fee: 0,
        currency: t.currency,
        description: "SCHEME TRANSFER",
        direction: "in" as const,
        review_rating: ratingByTransferId.get(t.id) ?? null,
      };
    });

    const payoutsWithNet = await Promise.all(
      payouts.data.map(async (p) => {
        const bt = await stripe.balanceTransactions.retrieve(
          p.balance_transaction as string,
          undefined,
          { stripeAccount: stripeAccountId }
        );
        return {
          id: p.id,
          created: p.arrival_date,
          available_on: p.arrival_date,
          type: "payout" as const,
          gross: p.amount,
          net: bt.net,
          fee: bt.fee,
          currency: p.currency,
          description: p.description ?? null,
          direction: "out" as const,
          review_rating: null,
        };
      })
    );

    const items = [...chargesWithNet, ...transfersWithRating, ...payoutsWithNet].sort(
      (a, b) => a.created - b.created
    );

    console.log("📦 REPORT ITEMS DEBUG:", items.map(i => ({
      type: i.type,
      id: i.id,                 // charge.id / transfer.id / payout.id
      gross: i.gross,
      net: i.net,
      created: i.created,
      review_rating: i.review_rating ?? null,
    })));

    // BALANCE
    const bal = await stripe.balance.retrieve(
      {},
      { stripeAccount: stripeAccountId }
    );

    const availableAmount = bal.available
      .filter((a) => a.currency === currency)
      .reduce((sum, row) => sum + row.amount, 0);

    const pendingAmount = bal.pending
      .filter((p) => p.currency === currency)
      .reduce((sum, row) => sum + row.amount, 0);

    const balanceNow = availableAmount + pendingAmount;

    const totalIn = items
      .filter((i) => i.direction === "in")
      .reduce((s, i) => s + i.gross, 0);

    const totalOut = items
      .filter((i) => i.direction === "out")
      .reduce((s, i) => s + i.gross, 0);

    console.log("EMPLOYER REPORTS API OUT:", {
      period: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      },
      currency,
      totals: {
        balance: balanceNow,
        totalIn,
        totalOut,
      },
      itemsCount: items.length,
    });

    return NextResponse.json({
      period: { from: fromDate.toISOString(), to: toDate.toISOString() },
      currency,
      totals: {
        balance: balanceNow,
        totalIn,
        totalOut,
      },
      items,
    });
  } catch (err) {
    console.error("EMPLOYER REPORTS API ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


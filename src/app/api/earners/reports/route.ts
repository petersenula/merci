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
// DATE RANGE
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

        const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
        const dow = simple.getUTCDay();
        const ISOweekStart =
          dow <= 4
            ? new Date(simple.setUTCDate(simple.getUTCDate() - dow + 1))
            : new Date(simple.setUTCDate(simple.getUTCDate() + 8 - dow));

        from = ISOweekStart;
        to = new Date(
          Date.UTC(
            from.getUTCFullYear(),
            from.getUTCMonth(),
            from.getUTCDate() + 6,
            23,
            59,
            59
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
        to = new Date(Date.UTC(year, month, 0, 23, 59, 59));
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
// MAIN HANDLER
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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles_earner")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || !profile.stripe_account_id || !profile.currency) {
      return NextResponse.json({ error: "Profile not ready" }, { status: 400 });
    }

    // ✅ гарантируем строки
    const stripeAccountId = profile.stripe_account_id as string;
    const currency = profile.currency.toLowerCase();

    const url = new URL(req.url);
    const period = url.searchParams.get("period");
    const value = url.searchParams.get("value");
    const fromParam = url.searchParams.get("from");
    const toParam = url.searchParams.get("to");

    const { fromTs, toTs, fromDate, toDate } = getPeriodRange(
      (period as Period) || "month",
      fromParam,
      toParam,
      value
    );

    // STRIPE CHARGES
    const charges = await stripe.charges.list(
      { created: { gte: fromTs, lte: toTs }, limit: 200 },
      { stripeAccount: stripeAccountId }
    );

    const paymentIntentIds = charges.data
      .map(c => c.payment_intent)
      .filter((id): id is string => typeof id === "string");

    const { data: tips } = await supabase
      .from("tips")
      .select("id, payment_intent_id, review_rating")
      .in("payment_intent_id", paymentIntentIds);

    const tipIds = (tips ?? []).map(t => t.id);

    const { data: splits } = await supabase
      .from("tip_splits")
      .select("tip_id, review_rating")
      .in("tip_id", tipIds);

    const tipByPaymentIntent = new Map(
      (tips ?? []).map(t => [t.payment_intent_id, t])
    );

    const splitsByTipId = new Map<string, number[]>();

    (splits ?? []).forEach(s => {
      if (s.review_rating == null) return;
      if (!splitsByTipId.has(s.tip_id)) {
        splitsByTipId.set(s.tip_id, []);
      }
      splitsByTipId.get(s.tip_id)!.push(s.review_rating);
    });

    const chargesWithNet = await Promise.all(
      charges.data.map(async c => {
        const bt = await stripe.balanceTransactions.retrieve(
          c.balance_transaction as string,
          undefined,
          { stripeAccount: stripeAccountId }
        );

        let review_rating: number | null = null;

        if (typeof c.payment_intent === "string") {
          const tip = tipByPaymentIntent.get(c.payment_intent);
          if (tip?.review_rating != null) {
            review_rating = tip.review_rating;
          } else if (tip && splitsByTipId.has(tip.id)) {
            review_rating = splitsByTipId.get(tip.id)![0];
          }
        }

        return {
          id: c.id,
          created: c.created,
          available_on: bt.available_on,
          type: "charge",
          gross: c.amount,
          net: bt.net,
          fee: bt.fee,
          currency: c.currency,
          description: c.description ?? null,
          direction: "in",
          review_rating,
        };
      })
    );

    const payouts = await stripe.payouts.list(
      { arrival_date: { gte: fromTs, lte: toTs }, limit: 200 },
      { stripeAccount: stripeAccountId }
    );

    const payoutsWithNet = await Promise.all(
      payouts.data.map(async p => {
        const bt = await stripe.balanceTransactions.retrieve(
          p.balance_transaction as string,
          undefined,
          { stripeAccount: stripeAccountId }
        );
        return {
          id: p.id,
          created: p.arrival_date,
          available_on: p.arrival_date,
          type: "payout",
          gross: p.amount,
          net: bt.net,
          fee: bt.fee,
          currency: p.currency,
          description: p.description ?? null,
          direction: "out",
          review_rating: null,
        };
      })
    );

    const items = [...chargesWithNet, ...payoutsWithNet].sort(
      (a, b) => a.created - b.created
    );

    const bal = await stripe.balance.retrieve(
      {},
      { stripeAccount: stripeAccountId }
    );

    const balanceNow =
      bal.available
        .filter(a => a.currency === currency)
        .reduce((s, a) => s + a.amount, 0) +
      bal.pending
        .filter(p => p.currency === currency)
        .reduce((s, p) => s + p.amount, 0);

    const totalIn = items.filter(i => i.direction === "in").reduce((s, i) => s + i.gross, 0);
    const totalOut = items.filter(i => i.direction === "out").reduce((s, i) => s + i.gross, 0);

    return NextResponse.json({
      period: { from: fromDate.toISOString(), to: toDate.toISOString() },
      currency: profile.currency,
      totals: {
        balance: balanceNow,
        totalIn,
        totalOut,
      },
      items,
    });

  } catch (err) {
    console.error("REPORTS API ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import type { Database } from "@/types/supabase";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

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
// MAIN HANDLER (EARNERS)
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
    const supabaseAdmin = getSupabaseAdmin();

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

    const stripeAccountId = profile.stripe_account_id as string;
    const currency = profile.currency.toLowerCase();

    const url = new URL(req.url);
    const period = url.searchParams.get("period");
    const value = url.searchParams.get("value");
    const fromParam = url.searchParams.get("from");
    const toParam = url.searchParams.get("to");

    let fromTs: number;
    let toTs: number;
    let fromDate: Date;
    let toDate: Date;

    // 🔥 1. CUSTOM PERIOD — если пришли from/to
    if (fromParam && toParam) {
      const [fy, fm, fd] = fromParam.split("-").map(Number);
      const [ty, tm, td] = toParam.split("-").map(Number);

      fromDate = new Date(Date.UTC(fy, fm - 1, fd));
      toDate = new Date(Date.UTC(ty, tm - 1, td, 23, 59, 59));

      fromTs = Math.floor(fromDate.getTime() / 1000);
      toTs = Math.floor(toDate.getTime() / 1000);
    }
    // 🔥 2. всё остальное — legacy (month / week / etc)
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

    // -----------------------------------
    // STRIPE TRANSFERS (INCOMING)
    // -----------------------------------
    const transfers = await stripe.transfers.list({
      created: { gte: fromTs, lte: toTs },
      destination: stripeAccountId,
      limit: 200,
    });

    const transferIds = transfers.data.map(t => t.id);

    // -----------------------------------
    // LOAD RATINGS
    // 1) tips
    // 2) tip_splits
    // -----------------------------------
    const { data: directTips } = transferIds.length
      ? await supabaseAdmin
          .from("tips")
          .select("stripe_transfer_id, review_rating")
          .in("stripe_transfer_id", transferIds)
      : { data: [] as any[] };

    const { data: schemeSplits } = transferIds.length
      ? await supabaseAdmin
          .from("tip_splits")
          .select("stripe_transfer_id, review_rating")
          .in("stripe_transfer_id", transferIds)
      : { data: [] as any[] };

    const ratingByTransfer = new Map<string, number>();

    (directTips ?? []).forEach((t: any) => {
      if (t.stripe_transfer_id && t.review_rating != null) {
        ratingByTransfer.set(String(t.stripe_transfer_id), t.review_rating);
      }
    });

    (schemeSplits ?? []).forEach((s: any) => {
      if (
        s.stripe_transfer_id &&
        s.review_rating != null &&
        !ratingByTransfer.has(String(s.stripe_transfer_id))
      ) {
        ratingByTransfer.set(String(s.stripe_transfer_id), s.review_rating);
      }
    });

    const transferItems = transfers.data.map(t => ({
      id: t.id,
      created: t.created,
      available_on: t.created,
      type: "transfer" as const,
      gross: t.amount,
      net: t.amount,
      fee: 0,
      currency: t.currency,
      description: "Tips · Click4Tip",
      direction: "in" as const,
      review_rating: ratingByTransfer.get(String(t.id)) ?? null,
    }));

    // -----------------------------------
    // STRIPE PAYOUTS (OUTGOING)
    // -----------------------------------
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
          type: "payout" as const,
          gross: p.amount,
          net: bt.net,
          fee: bt.fee,
          currency: p.currency,
          description: p.description ?? "STRIPE PAYOUT",
          direction: "out" as const,
          review_rating: null,
        };
      })
    );

    console.log("🧑‍🔧 EARNER REPORTS DEBUG:", {
      userId: user.id,
      stripeAccountId,
      currency,
    });

    console.log("📅 EARNER PERIOD DEBUG:", {
      period,
      value,
      fromParam,
      toParam,
      fromTs,
      toTs,
      fromISO: fromDate.toISOString(),
      toISO: toDate.toISOString(),
    });

    const items = [...transferItems, ...payoutsWithNet].sort(
      (a, b) => a.created - b.created
    );

    // -----------------------------------
    // BALANCE
    // -----------------------------------
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

    console.log("🧾 EARNER STRIPE TRANSFERS RAW:", transfers.data.map(t => ({
      id: t.id,
      amount: t.amount,
      currency: t.currency,
      created: t.created,
      destination: t.destination,
      transfer_group: t.transfer_group ?? null,
      description: t.description ?? null,
    })));

    console.log("📦 EARNER ITEMS DEBUG:", items.map(i => ({
      type: i.type,
      id: i.id,
      gross: i.gross,
      net: i.net,
      fee: i.fee,
      created: i.created,
      review_rating: i.review_rating ?? null,
    })));

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
    console.error("EARNER REPORTS API ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

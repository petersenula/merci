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
          { stripeAccount: stripeAccountId }
        );

        return {
          id: c.id,
          created: c.created,
          available_on: bt.available_on, 
          type: "charge" as const,
          gross: c.amount,
          net: bt.net,
          fee: bt.fee,
          currency: c.currency,
          description: c.description ?? null,
          direction: "in" as const,
        };
      })
    );

    const payoutsWithNet = await Promise.all(
      payouts.data.map(async (p) => {
        const bt = await stripe.balanceTransactions.retrieve(
          p.balance_transaction as string,
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
        };
      })
    );

    const items = [...chargesWithNet, ...payoutsWithNet].sort(
      (a, b) => a.created - b.created
    );

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
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
    fromDate: from,
    toDate: to,
  };
}

// -----------------------------------
// TYPES FOR RESPONSE ITEMS
// -----------------------------------
type ReportItem = {
  id: string;
  created: number; // unix seconds
  type: "transfer" | "payout";
  gross: number; // cents
  net: number;   // cents
  fee: number;   // cents
  currency: string;
  description: string | null;
  review_rating: number | null;
  status: "processing" | "completed";
};

// -----------------------------------
// MAIN HANDLER
// -----------------------------------
export async function GET(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    // 1) Supabase client (RLS!)
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

    // 2) Auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    // 3) Employer profile
    const { data: employer, error: employerError } = await supabaseAdmin
      .from("employers")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (employerError) {
      return NextResponse.json({ error: employerError.message }, { status: 500 });
    }

    if (!employer || !employer.stripe_account_id || !employer.currency) {
      return NextResponse.json({ error: "Employer not ready" }, { status: 400 });
    }

    const stripeAccountId = String(employer.stripe_account_id);
    const currencyUpper = String(employer.currency); // e.g. "CHF"
    const currencyLower = currencyUpper.toLowerCase(); // e.g. "chf"

    // 4) Period
    const url = new URL(req.url);
    const period = url.searchParams.get("period");
    const value = url.searchParams.get("value");
    const fromParam = url.searchParams.get("from");
    const toParam = url.searchParams.get("to");

    // ✅ IMPORTANT: if from/to пришли — это custom, НЕ month
    const effectivePeriod: Period =
      fromParam && toParam ? "custom" : ((period as Period) || "month");

    const { fromDate, toDate } = getPeriodRange(
      effectivePeriod,
      fromParam,
      toParam,
      value
    );

    // -----------------------------------
    // 5) Stripe balance (ONLY TOTAL)
    // -----------------------------------
    const bal = await stripe.balance.retrieve(
      {},
      { stripeAccount: stripeAccountId }
    );

    const availableAmount = bal.available
      .filter(a => a.currency === currencyLower)
      .reduce((sum, row) => sum + row.amount, 0);

    const pendingAmount = bal.pending
      .filter(p => p.currency === currencyLower)
      .reduce((sum, row) => sum + row.amount, 0);

    const balanceNow = availableAmount + pendingAmount;

    // -----------------------------------
    // 6) Completed = ledger_transactions (RLS)
    // -----------------------------------
    const { data: ledgerRows, error: ledgerError } = await supabaseAdmin
      .from("ledger_transactions")
      .select(`
        id,
        created_at,
        net_cents,
        amount_gross_cents,
        stripe_fee_cents,
        currency,
        stripe_object_id,
        operation_type,
        stripe_account_id
      `)
      .eq("stripe_account_id", stripeAccountId)
      .gte("created_at", fromDate.toISOString())
      .lte("created_at", toDate.toISOString())
      .order("created_at", { ascending: false }); // newest first

    if (ledgerError) {
      return NextResponse.json({ error: ledgerError.message }, { status: 500 });
    }

    const completedTransferIds = new Set<string>(
      (ledgerRows ?? [])
        .map(r => (r as any).stripe_object_id)
        .filter(Boolean)
        .map(String)
    );

    // -----------------------------------
    // 7) Ratings for COMPLETED (tips + tip_splits)
    //    RLS должен разрешать select по вашим строкам
    // -----------------------------------
    const ledgerTransferIdsArr = [...completedTransferIds];

    const { data: tipRatings, error: tipRatingsError } = ledgerTransferIdsArr.length
      ? await supabaseAdmin
          .from("tips")
          .select("stripe_transfer_id, review_rating")
          .in("stripe_transfer_id", ledgerTransferIdsArr)
      : { data: [], error: null };

    if (tipRatingsError) {
      return NextResponse.json({ error: tipRatingsError.message }, { status: 500 });
    }

    const { data: splitRatings, error: splitRatingsError } = ledgerTransferIdsArr.length
      ? await supabaseAdmin
          .from("tip_splits")
          .select("stripe_transfer_id, review_rating")
          .in("stripe_transfer_id", ledgerTransferIdsArr)
      : { data: [], error: null };

    if (splitRatingsError) {
      return NextResponse.json({ error: splitRatingsError.message }, { status: 500 });
    }

    const ratingByTransfer = new Map<string, number>();

    (tipRatings ?? []).forEach((r: any) => {
      if (r?.stripe_transfer_id && r.review_rating != null) {
        ratingByTransfer.set(String(r.stripe_transfer_id), Number(r.review_rating));
      }
    });

    (splitRatings ?? []).forEach((r: any) => {
      if (
        r?.stripe_transfer_id &&
        r.review_rating != null &&
        !ratingByTransfer.has(String(r.stripe_transfer_id))
      ) {
        ratingByTransfer.set(String(r.stripe_transfer_id), Number(r.review_rating));
      }
    });

    const completedItems: ReportItem[] = (ledgerRows ?? []).map((r: any) => {
      const created = Math.floor(new Date(r.created_at).getTime() / 1000);

      const isPayout = String(r.operation_type) === "payout";

      const stripeObjectId = r.stripe_object_id ? String(r.stripe_object_id) : "";

      return {
        id: String(r.id),
        created,
        type: isPayout ? "payout" : "transfer",
        gross: Number(r.amount_gross_cents ?? 0),
        net: Number(r.net_cents ?? 0),
        fee: Number(r.stripe_fee_cents ?? 0),
        currency: String(r.currency ?? currencyUpper),
        description: "Tips · Click4Tip",
        review_rating: stripeObjectId
          ? (ratingByTransfer.get(stripeObjectId) ?? null)
          : null,
        status: "completed",
      };
    });

    // -----------------------------------
    // 8) Processing = tips + tip_splits, которые ещё НЕ в ledger
    //    (fresh сверху)
    // -----------------------------------
    // ⚠️ Важно: NOT IN нельзя делать пустым списком.
    // Если ledger пустой — просто берём последние за период.
    const filterOutLedger = ledgerTransferIdsArr.length > 0;

    const ledgerTransferIdsCsv = ledgerTransferIdsArr.join(",");

    let tipsQuery = supabaseAdmin
      .from("tips")
      .select("id, created_at, net_cents, currency, stripe_transfer_id, review_rating")
      .gte("created_at", fromDate.toISOString())
      .lte("created_at", toDate.toISOString());

    let splitsQuery = supabaseAdmin
      .from("tip_splits")
      .select("id, created_at, net_cents, currency, stripe_transfer_id, review_rating")
      .gte("created_at", fromDate.toISOString())
      .lte("created_at", toDate.toISOString());

    if (filterOutLedger) {
      tipsQuery = tipsQuery.not(
        "stripe_transfer_id",
        "in",
        ledgerTransferIdsCsv
      );

      splitsQuery = splitsQuery.not(
        "stripe_transfer_id",
        "in",
        ledgerTransferIdsCsv
      );
    }

    const { data: processingTips, error: processingTipsError } = await tipsQuery;
    if (processingTipsError) {
      return NextResponse.json({ error: processingTipsError.message }, { status: 500 });
    }

    const { data: processingSplits, error: processingSplitsError } = await splitsQuery;
    if (processingSplitsError) {
      return NextResponse.json({ error: processingSplitsError.message }, { status: 500 });
    }

    const processingItems: ReportItem[] = [
      ...(processingTips ?? []),
      ...(processingSplits ?? []),
    ].map((t: any) => ({
      id: String(t.id),
      created: Math.floor(new Date(t.created_at).getTime() / 1000),
      type: "transfer" as const,
      gross: Number(t.net_cents ?? 0),
      net: Number(t.net_cents ?? 0),
      fee: 0,
      currency: String(t.currency ?? currencyUpper),
      description: "Processing",
      review_rating: t.review_rating != null ? Number(t.review_rating) : null,
      status: "processing" as const,
    }))
    .sort((a, b) => b.created - a.created);

    // -----------------------------------
    // 9) Final items: processing сверху, completed ниже
    // -----------------------------------
    const items: ReportItem[] = [
      ...processingItems,
      ...completedItems, // completed уже отсортированы desc
    ];

    // -----------------------------------
    // 10) Response
    // -----------------------------------
    return NextResponse.json({
      period: { from: fromDate.toISOString(), to: toDate.toISOString() },
      currency: currencyUpper,
      totals: {
        balance: balanceNow, // ✅ только общий баланс
      },
      items,
    });

  } catch (err: any) {
    console.error("EMPLOYER REPORTS API ERROR:", err);
    return NextResponse.json({ error: "Server error", details: String(err) }, { status: 500 });
  }
}

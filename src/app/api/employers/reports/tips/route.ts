// src/app/api/employers/reports/tips/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

// -----------------------------------
// PERIOD TYPE (как в Stripe reports)
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
// DATE RANGE (копия логики)
// Возвращает: fromDate/toDate + seconds
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
// MAIN HANDLER (EMPLOYERS TIPS REPORT)
// -----------------------------------
export async function GET(req: NextRequest) {
  try {
    const supabaseAdmin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: { persistSession: false, autoRefreshToken: false },
    }
    );

    const supabaseAuth = createClient<Database>(
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
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // GET EMPLOYER PROFILE
    const { data: employer, error: empErr } = await supabaseAdmin
      .from("employers")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (empErr) {
      return NextResponse.json({ error: "Employer load error" }, { status: 500 });
    }

    if (!employer) {
      return NextResponse.json({ error: "Employer profile not found" }, { status: 404 });
    }

    // QUERY PARAMS
    const url = new URL(req.url);
    const period = url.searchParams.get("period");
    const value = url.searchParams.get("value");
    const fromParam = url.searchParams.get("from");
    const toParam = url.searchParams.get("to");

    let fromDate: Date;
    let toDate: Date;

    // month + value (YYYY-MM)
    if (period === "month" && value) {
      const [year, month] = value.split("-").map(Number);
      fromDate = new Date(Date.UTC(year, month - 1, 1));
      toDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));
    }
    // week + value (YYYY-Wxx)
    else if (period === "week" && value) {
      const legacy = getPeriodRange("week", null, null, value);
      fromDate = legacy.fromDate;
      toDate = legacy.toDate;
    }
    // custom range
    else if (fromParam && toParam) {
      const legacy = getPeriodRange("custom", fromParam, toParam, null);
      fromDate = legacy.fromDate;
      toDate = legacy.toDate;
    }
    // default old presets
    else {
      const effectivePeriod: Period =
        fromParam && toParam ? "custom" : ((period as Period) || "month");
      const legacy = getPeriodRange(effectivePeriod, fromParam, toParam, value);
      fromDate = legacy.fromDate;
      toDate = legacy.toDate;
    }

    const fromIso = fromDate.toISOString();
    const toIso = toDate.toISOString();

    // 1) Load tips for this employer (distributed only)
    const { data: tips, error: tipsErr } = await supabaseAdmin
      .from("tips")
      .select(
        "id, created_at, currency, amount_net_cents, review_rating, scheme_id, distribution_status"
      )
      .eq("employer_id", employer.user_id)
      .eq("distribution_status", "distributed")
      .gte("created_at", fromIso)
      .lte("created_at", toIso)
      .order("created_at", { ascending: false })
      .limit(500);

    if (tipsErr) {
      return NextResponse.json({ error: "Tips load error" }, { status: 500 });
    }

    console.log("TIPS REPORT DEBUG:", {
    tipsErr,
    tipsCount: tips?.length,
    employerUserId: employer.user_id,
    fromIso,
    toIso,
    });

    const schemeIds = Array.from(
      new Set((tips ?? []).map((t) => t.scheme_id).filter(Boolean))
    ) as string[];

    // 2) Load schemes map (id -> name)
    let schemeMap: Record<string, string> = {};

    if (schemeIds.length > 0) {
      const { data: schemes, error: schErr } = await supabaseAdmin
        .from("allocation_schemes")
        .select("id, name")
        .in("id", schemeIds);

      if (!schErr && schemes) {
        for (const s of schemes) {
          schemeMap[s.id] = s.name;
        }
      }
    }

    const items = (tips ?? []).map((t) => ({
      id: t.id,
      created_at: t.created_at,
      amount_net_cents: t.amount_net_cents,
      currency: t.currency,
      review_rating: t.review_rating,
      scheme_id: t.scheme_id,
      scheme_name: t.scheme_id ? schemeMap[t.scheme_id] ?? null : null,
    }));

    // totals (простые)
    const totalNet = items.reduce((sum, it) => sum + (it.amount_net_cents || 0), 0);
    const ratings = items.map((it) => it.review_rating).filter((r) => typeof r === "number") as number[];
    const avgRating = ratings.length ? ratings.reduce((s, r) => s + r, 0) / ratings.length : null;

    return NextResponse.json({
      period: { from: fromIso, to: toIso },
      totals: {
        tipsCount: items.length,
        totalNetCents: totalNet,
        avgRating,
      },
      items,
    });
  } catch (err) {
    console.error("EMPLOYER TIPS REPORT API ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
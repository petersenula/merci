// supabase/functions/ledger_orchestrator/index.ts
declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
  env: { get: (key: string) => string | undefined };
};

// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// YYYY-MM-DD in UTC
function dayUTC(d: Date) {
  return d.toISOString().slice(0, 10);
}

// Convert day range to unix seconds (inclusive day boundaries)
function dayToRangeTs(day: string) {
  const from = new Date(`${day}T00:00:00.000Z`);
  const to = new Date(`${day}T23:59:59.000Z`);
  return {
    fromTs: Math.floor(from.getTime() / 1000),
    toTs: Math.floor(to.getTime() / 1000),
  };
}

Deno.serve(async (req) => {
  try {
    const supabase = getSupabase();
    const url = new URL(req.url);

    // ✅ manual controls
    // - ?date=YYYY-MM-DD   -> create jobs for that day (useful for backfill / testing)
    // - ?limit=200         -> how many accounts to enqueue in one run
    // - ?include=platform|connected|all
    const dateParam = url.searchParams.get("date");
    const limitParam = url.searchParams.get("limit");
    const includeParam = url.searchParams.get("include") ?? "all";

    const limit = limitParam ? Math.max(1, Math.min(2000, Number(limitParam))) : 500;

    const day = dateParam ? dateParam : dayUTC(new Date());
    const { fromTs, toTs } = dayToRangeTs(day);

    // 1) load sync targets
    let query = supabase
      .from("ledger_sync_accounts")
      .select("stripe_account_id, account_type, internal_id, is_active")
      .eq("is_active", true);

    if (includeParam === "platform") {
      query = query.eq("account_type", "platform");
    } else if (includeParam === "connected") {
      query = query.in("account_type", ["earner", "employer"]);
    }

    const { data: accounts, error: accountsErr } = await query.limit(limit);

    if (accountsErr) {
      console.error("ORCH_LOAD_ACCOUNTS_ERROR", accountsErr);
      return json({ ok: false, error: String(accountsErr.message) }, 500);
    }

    if (!accounts || accounts.length === 0) {
      return json({ ok: true, enqueued: 0, day, fromTs, toTs, note: "No active accounts" });
    }

    // 2) enqueue "sync" jobs
    // For now: we enqueue simple "sync" jobs (worker will decide incremental range by cursor)
    // We also include from/to for future backfill usage (optional but helpful)
    const jobs = accounts.map((a) => ({
      job_type: "sync",
      stripe_account_id: a.stripe_account_id ?? null,
      account_type: a.account_type,
      from_ts: fromTs,
      to_ts: toTs,
      status: "queued",
    }));

    const { data: inserted, error: insErr } = await supabase
      .from("ledger_sync_jobs")
      .insert(jobs)
      .select("id");

    if (insErr) {
      console.error("ORCH_INSERT_JOBS_ERROR", insErr);
      return json({ ok: false, error: String(insErr.message) }, 500);
    }

    return json({
      ok: true,
      day,
      fromTs,
      toTs,
      enqueued: inserted?.length ?? 0,
      limit_used: limit,
      include: includeParam,
    });
  } catch (e) {
    console.error("ORCH_FATAL", e);
    return json({ ok: false, error: String(e) }, 500);
  }
});

// supabase/functions/ledger_backfill_all/index.ts
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

Deno.serve(async (req) => {
  const supabase = getSupabase();

  let payload: any = {};
  try {
    payload = await req.json().catch(() => ({}));
  } catch {}

  // default: 2015-01-01
  const from_ts = typeof payload.from_ts === "number" ? payload.from_ts : 1420070400;
  const to_ts = typeof payload.to_ts === "number" ? payload.to_ts : null;

  // сколько аккаунтов в одном запуске (чтобы не упереться в timeout)
  const limit = typeof payload.limit === "number" ? payload.limit : 50;

  // только активные
  const { data: accounts, error } = await supabase
    .from("ledger_sync_accounts")
    .select("stripe_account_id, account_type, is_active")
    .eq("is_active", true)
    .limit(limit);

  if (error) return json({ ok: false, error: error.message }, 500);

  if (!accounts || accounts.length === 0) {
    return json({ ok: true, queued: 0, note: "No active accounts" });
  }

  const results: any[] = [];
  let queued = 0;

  for (const acc of accounts) {
    const account_type = acc.account_type; // earner | employer | platform
    const stripe_account_id = acc.stripe_account_id ?? null;

    const { error: jobErr } = await supabase
      .from("ledger_sync_jobs")
      .insert({
        job_type: "sync",
        status: "queued",
        account_type,
        stripe_account_id,
        from_ts,
        to_ts,
        attempts: 0,
        error: null,
      });

    if (jobErr) {
      results.push({
        account_type,
        stripe_account_id,
        ok: false,
        error: jobErr.message,
      });
      continue;
    }

    queued++;
    results.push({
      account_type,
      stripe_account_id,
      ok: true,
      from_ts,
      to_ts,
    });
  }

  return json({ ok: true, queued, results });
});

// supabase/functions/ledger_mark_dirty/index.ts

declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
  env: { get: (key: string) => string | undefined };
};

// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
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

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON" }, 400);
  }

  const {
    mode, // "connected" | "platform"
    stripe_account_id, // string | null
    from_ts = null,
    to_ts = null,
    source = "manual", // "webhook" | "manual" | "cron"
    event_type = null,
  } = payload;

  if (!mode || (mode !== "connected" && mode !== "platform")) {
    return json({ ok: false, error: "Invalid mode" }, 400);
  }

  if (mode === "connected" && !stripe_account_id) {
    return json(
      { ok: false, error: "stripe_account_id required for connected mode" },
      400
    );
  }

  // --------------------------------------------------
  // 1) Resolve account_type
  // --------------------------------------------------
  let resolvedAccountType: "earner" | "employer" | "platform";

  if (mode === "platform") {
    resolvedAccountType = "platform";
  } else {
    const { data: earner, error: earnerErr } = await supabase
      .from("profiles_earner")
      .select("id")
      .eq("stripe_account_id", stripe_account_id)
      .maybeSingle();

    if (earnerErr) return json({ ok: false, error: earnerErr.message }, 500);

    if (earner) {
      resolvedAccountType = "earner";
    } else {
      const { data: employer, error: empErr } = await supabase
        .from("employers")
        .select("user_id")
        .eq("stripe_account_id", stripe_account_id)
        .maybeSingle();

      if (empErr) return json({ ok: false, error: empErr.message }, 500);

      if (employer) {
        resolvedAccountType = "employer";
      } else {
        return json({ ok: false, error: "Unknown stripe_account_id" }, 400);
      }
    }
  }

  // --------------------------------------------------
  // 2) Ensure sync-account exists (idempotent)
  // --------------------------------------------------
  const syncStripeAccountId = resolvedAccountType === "platform"
    ? null
    : stripe_account_id;

  // --------------------------------------------------
  // 2) Ensure sync-account exists (CORRECT NULL HANDLING)
  // --------------------------------------------------

  let accQuery = supabase
    .from("ledger_sync_accounts")
    .select("id, is_active")
    .eq("account_type", resolvedAccountType)
    .limit(1);

  if (resolvedAccountType === "platform") {
    accQuery = accQuery.is("stripe_account_id", null);
  } else {
    accQuery = accQuery.eq("stripe_account_id", syncStripeAccountId);
  }

  const { data: existing } = await accQuery.maybeSingle();

  if (!existing) {
    const { error: upsertErr } = await supabase
      .from("ledger_sync_accounts")
      .insert({
        account_type: resolvedAccountType,
        stripe_account_id: syncStripeAccountId,
        internal_id: null,
        is_active: true,
        last_synced_ts: 0,
        last_synced_tx_id: null,
        locked_at: null,
        lock_token: null,
      });

    if (upsertErr) {
      return json({ ok: false, error: upsertErr.message }, 500);
    }
  }

  // --------------------------------------------------
  // 3a) Deduplicate sync jobs (queued or running)
  // --------------------------------------------------
  const { data: existingJob } = await supabase
    .from("ledger_sync_jobs")
    .select("id")
    .eq("job_type", "sync")
    .eq("account_type", resolvedAccountType)
    .eq("stripe_account_id", syncStripeAccountId)
    .in("status", ["queued", "running"])
    .limit(1)
    .maybeSingle();

  if (existingJob) {
    return json({
      ok: true,
      queued: false,
      reason: "job already queued or running",
      account_type: resolvedAccountType,
      stripe_account_id:
        resolvedAccountType === "platform" ? "platform" : stripe_account_id,
      source,
      event_type,
    });
  }

  // --------------------------------------------------
  // 3) Enqueue job
  // --------------------------------------------------
  const { error: jobErr } = await supabase.from("ledger_sync_jobs").insert({
    job_type: "sync",
    status: "queued",
    account_type: resolvedAccountType,
    stripe_account_id: syncStripeAccountId,
    from_ts,
    to_ts,
    attempts: 0,
    error: null,
  });

  if (jobErr) return json({ ok: false, error: jobErr.message }, 500);

  return json({
    ok: true,
    queued: true,
    account_type: resolvedAccountType,
    stripe_account_id: resolvedAccountType === "platform" ? "platform" : stripe_account_id,
    source,
    event_type,
  });
});

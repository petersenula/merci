// supabase/functions/ledger_worker_sync/index.ts
declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
  env: { get: (key: string) => string | undefined };
};

// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-ignore
import Stripe from "npm:stripe@12.18.0";

import {
  fetchStripeLedgerPaged,
  saveLedgerItems,
} from "../ledger_shared.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

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

Deno.serve(async (_req) => {
  const supabase = getSupabase();

  // ⚙️ сколько jobs обрабатываем за один запуск
  const BATCH_SIZE = 10;

  // 1️⃣ берём queued jobs
  const { data: jobs, error: jobsErr } = await supabase
    .from("ledger_sync_jobs")
    .select("*")
    .eq("status", "queued")
    .eq("job_type", "sync")
    .limit(BATCH_SIZE);

  if (jobsErr) {
    console.error("LOAD_JOBS_ERROR", jobsErr);
    return json({ ok: false, error: jobsErr.message }, 500);
  }

  if (!jobs || jobs.length === 0) {
    return json({ ok: true, processed: 0, note: "No jobs" });
  }

  const results: any[] = [];

  // 2️⃣ обрабатываем jobs по одной
  for (const job of jobs) {
    const jobId = job.id;

    try {
      // помечаем job как running
      await supabase
        .from("ledger_sync_jobs")
        .update({ status: "running" })
        .eq("id", jobId);

      // 3️⃣ грузим sync-account (cursor)
      const { data: acc, error: accErr } = await supabase
        .from("ledger_sync_accounts")
        .select("*")
        .eq("stripe_account_id", job.stripe_account_id)
        .eq("account_type", job.account_type)
        .single();

      if (accErr || !acc) {
        throw new Error("Sync account not found");
      }

      const fromTs =
        acc.last_synced_ts && acc.last_synced_ts > 0
          ? acc.last_synced_ts + 1
          : job.from_ts ?? 0;

      const toTs = job.to_ts ?? Math.floor(Date.now() / 1000);

      // 4️⃣ тянем ledger из Stripe
      const items = await fetchStripeLedgerPaged(
        acc.stripe_account_id,
        fromTs,
        toTs,
      );

      // 5️⃣ сохраняем в БД
      const inserted = await saveLedgerItems(
        acc.stripe_account_id,
        items,
      );

      // 6️⃣ обновляем cursor
      if (items.length > 0) {
        const maxCreated = Math.max(...items.map((i) => i.created));

        await supabase
          .from("ledger_sync_accounts")
          .update({
            last_synced_ts: maxCreated,
            last_synced_tx_id: items[items.length - 1].id,
          })
          .eq("id", acc.id);
      }

      // 7️⃣ job done
      await supabase
        .from("ledger_sync_jobs")
        .update({ status: "done" })
        .eq("id", jobId);

      results.push({
        jobId,
        account: acc.stripe_account_id ?? "platform",
        fetched: items.length,
        inserted,
        fromTs,
        toTs,
      });

    } catch (e: any) {
      console.error("JOB_FAILED", jobId, e);

      await supabase
        .from("ledger_sync_jobs")
        .update({
          status: "error",
          error: String(e),
          attempts: (job.attempts ?? 0) + 1,
        })
        .eq("id", jobId);

      results.push({
        jobId,
        error: String(e),
      });
    }
  }

  return json({
    ok: true,
    processed: results.length,
    results,
  });
});

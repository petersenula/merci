// supabase/functions/ledger_worker_sync/index.ts

declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
  env: { get: (key: string) => string | undefined };
};

// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  fetchStripeLedgerPaged,
  saveLedgerItems,
} from "../ledger_shared.ts";

// ================================
// LIVE MONEY START DATE
// ================================
const LIVE_START_TS = Math.floor(
  new Date("2025-12-28T00:00:00Z").getTime() / 1000
);

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

Deno.serve(async () => {
  const supabase = getSupabase();
  const BATCH_SIZE = 10;

  const { data: jobs } = await supabase
    .from("ledger_sync_jobs")
    .select("*")
    .eq("status", "queued")
    .eq("job_type", "sync")
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (!jobs || jobs.length === 0) {
    return json({ ok: true, processed: 0 });
  }

  const results: any[] = [];

  for (const job of jobs) {
    const jobId = job.id;
    let lockToken: string | null = null;

    try {
      // ------------------------------
      // mark job running
      // ------------------------------
      await supabase
        .from("ledger_sync_jobs")
        .update({ status: "running" })
        .eq("id", jobId);

      // ------------------------------
      // find sync account (STRICT)
      // ------------------------------
      let accQuery = supabase
        .from("ledger_sync_accounts")
        .select("*")
        .eq("account_type", job.account_type)
        .limit(1);

      if (job.account_type === "platform") {
        accQuery = accQuery.is("stripe_account_id", null);
      } else {
        accQuery = accQuery.eq("stripe_account_id", job.stripe_account_id);
      }

      const { data: acc, error: accErr } = await accQuery.maybeSingle();

      if (accErr || !acc) {
        throw new Error("Sync account not found");
      }

      // ------------------------------
      // lock account
      // ------------------------------
      lockToken = crypto.randomUUID();

      const { data: locked } = await supabase
        .from("ledger_sync_accounts")
        .update({
          locked_at: new Date().toISOString(),
          lock_token: lockToken,
        })
        .eq("id", acc.id)
        .is("locked_at", null)
        .select()
        .maybeSingle();

      if (!locked) throw new Error("Account is locked");

      // ------------------------------
      // resolve Stripe account
      // ------------------------------
      const stripeAccount =
        acc.account_type === "platform"
          ? undefined
          : acc.stripe_account_id;

      // ------------------------------
      // fetch Stripe ledger
      // ------------------------------
      console.log("LEDGER SYNC", {
        account: stripeAccount ?? "platform",
        to_ts: job.to_ts,
      });
      const items = await fetchStripeLedgerPaged(
        stripeAccount,
        null, // ❗ ВАЖНО: cursor отключаем для backfill
        job.to_ts ?? undefined
      );
      console.log("FETCHED ITEMS", items.length);

      // ------------------------------
      // save to unified ledger
      // ------------------------------

      console.log("LEDGER WORKER → SAVE", {
        stripe_account: stripeAccount ?? "platform",
        items_count: items.length,
      });

      const inserted = await saveLedgerItems(
        stripeAccount,
        items
      );

      console.log("LEDGER WORKER ← SAVE RESULT", {
        stripe_account: stripeAccount ?? "platform",
        inserted,
      });

      // ------------------------------
      // advance cursor
      // ------------------------------
      if (items.length > 0) {
        const last = items.reduce((a, b) =>
          a.created > b.created ? a : b
        );

        await supabase
          .from("ledger_sync_accounts")
          .update({
            last_synced_ts: last.created,
            last_synced_tx_id: last.id,
          })
          .eq("id", acc.id);
      }

      // ------------------------------
      // mark job done
      // ------------------------------
      await supabase
        .from("ledger_sync_jobs")
        .update({ status: "done" })
        .eq("id", jobId);

      results.push({
        jobId,
        fetched: items.length,
        inserted,
      });

    } catch (e: any) {
      await supabase
        .from("ledger_sync_jobs")
        .update({
          status: "error",
          error: String(e),
          attempts: (job.attempts ?? 0) + 1,
        })
        .eq("id", jobId);

      results.push({ jobId, error: String(e) });

    } finally {
      if (lockToken) {
        await supabase
          .from("ledger_sync_accounts")
          .update({
            locked_at: null,
            lock_token: null,
          })
          .eq("lock_token", lockToken);
      }
    }
  }

  return json({ ok: true, processed: results.length, results });
});

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { distributeSchemeImmediate } from "@/lib/schemeDistribution";

export const runtime = "nodejs";

const BATCH_SIZE = 25;
const LIVE_DISTRIBUTION_GRACE_MS = 2 * 60_000;
const RETRY_LOCK_TIMEOUT_MS = 5 * 60_000;

function nextRetryIso(retryCount: number) {
  const delaySeconds = Math.min(
    30 * 2 ** Math.max(retryCount - 1, 0),
    60 * 60
  );

  return new Date(Date.now() + delaySeconds * 1000).toISOString();
}

export async function GET(req: Request) {
  return POST(req);
}

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  const now = new Date();
  const nowIso = now.toISOString();

  // Do not race with a live payment_intent.succeeded webhook.
  const staleDistributionBefore = new Date(
    now.getTime() - LIVE_DISTRIBUTION_GRACE_MS
  ).toISOString();

  // A retry worker that died while holding the lock may be recovered
  // after this timeout.
  const staleRetryLockBefore = new Date(
    now.getTime() - RETRY_LOCK_TIMEOUT_MS
  ).toISOString();

  // ----------------------------------------------------------
  // 1. Normal retry candidates
  // ----------------------------------------------------------

  const { data: retryable, error: retryableError } = await supabaseAdmin
    .from("tips")
    .select(
      "id, payment_intent_id, scheme_id, employer_id, stripe_charge_id, distribution_status, distribution_retry_count, distribution_retry_started_at"
    )
    .in("distribution_status", ["distributing", "partially_failed"])
    .not("payment_intent_id", "is", null)
    .not("scheme_id", "is", null)
    .not("employer_id", "is", null)
    .not("stripe_charge_id", "is", null)
    .lte("created_at", staleDistributionBefore)
    .or(
      `distribution_next_retry_at.is.null,distribution_next_retry_at.lte.${nowIso}`
    )
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (retryableError) {
    console.error(
      "distribution-retry: failed to load retryable tips:",
      retryableError
    );

    return NextResponse.json(
      { ok: false, error: "failed_to_load_retryable" },
      { status: 500 }
    );
  }

  // ----------------------------------------------------------
  // 2. Recover abandoned retry locks
  // ----------------------------------------------------------

  const { data: staleLocks, error: staleLocksError } = await supabaseAdmin
    .from("tips")
    .select(
      "id, payment_intent_id, scheme_id, employer_id, stripe_charge_id, distribution_status, distribution_retry_count, distribution_retry_started_at"
    )
    .eq("distribution_status", "distribution_retrying")
    .not("payment_intent_id", "is", null)
    .not("scheme_id", "is", null)
    .not("employer_id", "is", null)
    .not("stripe_charge_id", "is", null)
    .not("distribution_retry_started_at", "is", null)
    .lte("distribution_retry_started_at", staleRetryLockBefore)
    .order("distribution_retry_started_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (staleLocksError) {
    console.error(
      "distribution-retry: failed to load stale retry locks:",
      staleLocksError
    );

    return NextResponse.json(
      { ok: false, error: "failed_to_load_stale_locks" },
      { status: 500 }
    );
  }

  // Deduplicate and keep the total batch bounded.
  const candidateMap = new Map<string, any>();

  for (const tip of [...(retryable ?? []), ...(staleLocks ?? [])]) {
    if (!candidateMap.has(tip.id)) {
      candidateMap.set(tip.id, tip);
    }
  }

  const candidates = Array.from(candidateMap.values()).slice(0, BATCH_SIZE);

  if (candidates.length === 0) {
    return NextResponse.json({ ok: true, processed: 0 });
  }

  let processed = 0;
  let distributed = 0;
  let rescheduled = 0;
  let failed = 0;

  for (const tip of candidates) {
    const previousRetryCount = tip.distribution_retry_count ?? 0;
    const nextRetryCount = previousRetryCount + 1;

    // --------------------------------------------------------
    // 3. CAS lock
    // --------------------------------------------------------

    let lockQuery = supabaseAdmin
      .from("tips")
      .update({
        distribution_status: "distribution_retrying",
        distribution_error: null,
        distribution_retry_count: nextRetryCount,
        distribution_retry_started_at: nowIso,
        distribution_next_retry_at: null,
      })
      .eq("id", tip.id)
      .eq("distribution_status", tip.distribution_status)
      .eq("distribution_retry_count", previousRetryCount);

    // For an abandoned lock, also compare the exact old lock timestamp.
    if (
      tip.distribution_status === "distribution_retrying" &&
      tip.distribution_retry_started_at
    ) {
      lockQuery = lockQuery.eq(
        "distribution_retry_started_at",
        tip.distribution_retry_started_at
      );
    }

    const { data: locked, error: lockError } = await lockQuery
      .select(
        "id, payment_intent_id, scheme_id, employer_id, stripe_charge_id, distribution_retry_count"
      )
      .maybeSingle();

    if (lockError) {
      console.error(
        "distribution-retry: failed to lock tip:",
        tip.id,
        lockError
      );
      continue;
    }

    if (!locked) {
      continue;
    }

    processed++;

    try {
      // Keep distribution_retrying while the shared helper runs.
      // Successful split rows are idempotent and already-completed
      // parts are skipped by the helper.
      await distributeSchemeImmediate({
        tipId: locked.id,
        schemeId: locked.scheme_id!,
        employerId: locked.employer_id!,
        sourceChargeId: locked.stripe_charge_id!,
        paymentIntentId: locked.payment_intent_id!,
        markDistributing: false,
      });

      const { data: finalTip, error: finalLoadError } = await supabaseAdmin
        .from("tips")
        .select("distribution_status")
        .eq("id", locked.id)
        .single();

      if (finalLoadError || !finalTip) {
        throw new Error(
          finalLoadError?.message ?? "Failed to load distribution result"
        );
      }

      if (finalTip.distribution_status === "distributed") {
        await supabaseAdmin
          .from("tips")
          .update({
            distribution_retry_started_at: null,
            distribution_next_retry_at: null,
          })
          .eq("id", locked.id);

        distributed++;
        continue;
      }

      if (finalTip.distribution_status === "partially_failed") {
        await supabaseAdmin
          .from("tips")
          .update({
            distribution_retry_started_at: null,
            distribution_next_retry_at: nextRetryIso(
              locked.distribution_retry_count
            ),
          })
          .eq("id", locked.id);

        rescheduled++;
        continue;
      }

      if (finalTip.distribution_status === "failed") {
        await supabaseAdmin
          .from("tips")
          .update({
            distribution_retry_started_at: null,
            distribution_next_retry_at: null,
          })
          .eq("id", locked.id);

        failed++;
        continue;
      }

      throw new Error(
        `Unexpected final distribution status: ${finalTip.distribution_status}`
      );
    } catch (error) {
      console.error(
        "distribution-retry: unexpected distribution error:",
        locked.id,
        error
      );

      await supabaseAdmin
        .from("tips")
        .update({
          distribution_status: "partially_failed",
          distribution_error:
            error instanceof Error
              ? error.message
              : "Distribution retry failed unexpectedly",
          distribution_retry_started_at: null,
          distribution_next_retry_at: nextRetryIso(
            locked.distribution_retry_count
          ),
        })
        .eq("id", locked.id);

      rescheduled++;
    }
  }

  return NextResponse.json({
    ok: true,
    processed,
    distributed,
    rescheduled,
    failed,
  });
}

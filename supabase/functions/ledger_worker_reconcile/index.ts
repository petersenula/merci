import { getSupabase } from "../ledger_shared.ts";

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function sum(arr: number[]) {
  return arr.reduce((a, b) => a + b, 0);
}

/* ------------------------------------------------------------------ */
/* Worker                                                             */
/* ------------------------------------------------------------------ */

Deno.serve(async () => {
  const supabase = getSupabase();

  const now = new Date();
  const day = now.toISOString().split("T")[0];

  const fromTs = `${day}T00:00:00.000Z`;
  const toTs   = `${day}T23:59:59.999Z`;

  console.log("RECONCILE START", { day, fromTs, toTs });

  /* ================================================================ */
  /* 1️⃣ PLATFORM (через Node API)                                     */
  /* ================================================================ */

  {
    const res = await fetch(
      "https://YOUR_DOMAIN.com/api/ledger/reconcile",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "platform" }),
      }
    );

    const data = await res.json();

    if (!data.ok) {
      throw new Error(`Platform reconcile failed: ${data.error}`);
    }

    const stripeAmount = data.balance_cents;

    const { data: txs } = await supabase
      .from("ledger_platform_transactions")
      .select("net_cents")
      .gte("created_at", fromTs)
      .lte("created_at", toTs);

    const delta = sum(
      (txs ?? []).map((t: { net_cents: number | null }) => t.net_cents ?? 0)
    );

    const { data: prev } = await supabase
      .from("ledger_platform_balances")
      .select("balance_end_cents")
      .lt("date", day)
      .order("date", { ascending: false })
      .limit(1);

    const start = prev?.[0]?.balance_end_cents ?? 0;
    const expected = start + delta;

    await supabase.from("ledger_platform_balances").upsert({
      date: day,
      currency: "CHF",
      balance_start_cents: start,
      balance_end_cents: stripeAmount,
      delta_cents: delta,
      matched: expected === stripeAmount,
    });
  }

  /* ================================================================ */
  /* 2️⃣ EARNERS (через Node API)                                      */
  /* ================================================================ */

  const { data: earners } = await supabase
    .from("profiles_earner")
    .select("id, stripe_account_id, currency")
    .not("stripe_account_id", "is", null);

  for (const e of earners ?? []) {
    if (!e.stripe_account_id) continue;

    const res = await fetch(
      "https://YOUR_DOMAIN.com/api/ledger/reconcile",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "earner",
          stripeAccountId: e.stripe_account_id,
        }),
      }
    );

    const data = await res.json();

    if (!data.ok) {
      console.error("SKIP EARNER", {
        earner_id: e.id,
        stripe_account_id: e.stripe_account_id,
        error: data.error,
      });
      continue;
    }

    const stripeAmount = data.balance_cents;

    const { data: txs } = await supabase
      .from("ledger_transactions")
      .select("net_cents")
      .eq("earner_id", e.id)
      .gte("created_at", fromTs)
      .lte("created_at", toTs);

    const delta = sum(
      (txs ?? []).map((t: { net_cents: number | null }) => t.net_cents ?? 0)
    );

    const { data: prev } = await supabase
      .from("ledger_balances")
      .select("balance_end_cents")
      .eq("account_id", e.id)
      .eq("account_type", "earner")
      .lt("date", day)
      .order("date", { ascending: false })
      .limit(1);

    const start = prev?.[0]?.balance_end_cents ?? 0;
    const expected = start + delta;

    await supabase.from("ledger_balances").upsert({
      date: day,
      account_id: e.id,
      account_type: "earner",
      currency: e.currency,
      balance_start_cents: start,
      balance_end_cents: stripeAmount,
      delta_cents: delta,
      matched: expected === stripeAmount,
    });
  }

  /* ================================================================ */

  return new Response(JSON.stringify({ ok: true, date: day }), {
    headers: { "Content-Type": "application/json" },
  });
});

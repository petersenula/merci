import { getSupabase } from "../ledger_shared.ts";

/* ------------------------------------------------------------------ */
/* Worker                                                             */
/* ------------------------------------------------------------------ */

Deno.serve(async () => {
  const supabase = getSupabase();
  const INTERNAL_KEY = Deno.env.get("LEDGER_INTERNAL_KEY");

  if (!INTERNAL_KEY) {
    throw new Error("LEDGER_INTERNAL_KEY missing");
  }

  const day = new Date().toISOString().split("T")[0];

  console.log("RECONCILE START", { day });

  /* ================================================================ */
  /* 1️⃣ PLATFORM (через Node API)                                     */
  /* ================================================================ */

  {
    const res = await fetch("https://click4tip.com/api/ledger/reconcile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ledger-key": INTERNAL_KEY,
      },
      body: JSON.stringify({ type: "platform", day }),
    });

    const data = await res.json();

    if (!data.ok) {
      throw new Error(`Platform reconcile failed: ${data.error}`);
    }

    await supabase.from("ledger_platform_balances").upsert({
      date: day,
      currency: data.currency,
      balance_start_cents: data.balance_start_cents,
      balance_end_cents: data.balance_end_cents,
      delta_cents: data.delta_cents,
      matched: data.matched,
    });
  }

  /* ================================================================ */
  /* 2️⃣ EARNERS (через Node API)                                      */
  /* ================================================================ */

  const { data: earners } = await supabase
    .from("profiles_earner")
    .select("id, stripe_account_id")
    .not("stripe_account_id", "is", null);

  for (const e of earners ?? []) {
    if (!e.stripe_account_id) continue;

    const res = await fetch("https://click4tip.com/api/ledger/reconcile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ledger-key": INTERNAL_KEY,
      },
      body: JSON.stringify({
        type: "earner",
        day,
        stripeAccountId: e.stripe_account_id,
        accountId: e.id,
      }),
    });

    const data = await res.json();

    if (!data.ok) {
      console.error("SKIP EARNER", {
        earner_id: e.id,
        stripe_account_id: e.stripe_account_id,
        error: data.error,
      });
      continue;
    }

    await supabase.from("ledger_balances").upsert({
      date: day,
      account_id: e.id,
      account_type: "earner",
      currency: data.currency,
      balance_start_cents: data.balance_start_cents,
      balance_end_cents: data.balance_end_cents,
      delta_cents: data.delta_cents,
      matched: data.matched,
    });
  }

  /* ================================================================ */

  return new Response(JSON.stringify({ ok: true, date: day }), {
    headers: { "Content-Type": "application/json" },
  });
});

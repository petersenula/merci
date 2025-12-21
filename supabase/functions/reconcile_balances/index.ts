declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
  env: {
    get(key: string): string | undefined;
  };
};

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Stripe from "npm:stripe@12.18.0";

import { getSupabase } from "../ledger_shared.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

function dayUTC(date: Date) {
  return date.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  const supabase = getSupabase();
  const url = new URL(req.url);

  // optional manual range
  const dateParam = url.searchParams.get("date");
  const date = dateParam ? new Date(dateParam) : new Date();
  const day = dayUTC(date);

  console.log("RECONCILE_START", { day });

  // ==========================
  // PLATFORM
  // ==========================
  {
    const stripeBalance = await stripe.balance.retrieve();
    const stripeAmount =
      (stripeBalance.available[0]?.amount ?? 0) +
      (stripeBalance.pending[0]?.amount ?? 0);

    const { data: txns } = await supabase
      .from("ledger_platform_transactions")
      .select("net_cents")
      .gte("created_at", `${day}T00:00:00Z`)
      .lte("created_at", `${day}T23:59:59Z`);

      const delta =
        (txns as { net_cents: number }[])?.reduce(
          (sum: number, t) => sum + t.net_cents,
          0
        ) ?? 0;

    const { data: prev } = await supabase
      .from("ledger_platform_balances")
      .select("balance_end_cents")
      .lt("date", day)
      .order("date", { ascending: false })
      .limit(1);

    const start = prev?.[0]?.balance_end_cents ?? 0;
    const expected = start + delta;

    await supabase.from("ledger_platform_balances").upsert(
      {
        date: day,
        balance_start_cents: start,
        balance_end_cents: stripeAmount,
        currency: "CHF",
        matched: expected === stripeAmount,
        delta_cents: delta,
      },
      { onConflict: "date" }
    );

    console.log("PLATFORM_DONE", {
      start,
      delta,
      expected,
      stripeAmount,
    });
  }

  // ==========================
  // CONNECTED ACCOUNTS
  // ==========================
  const { data: accounts } = await supabase
    .from("profiles_earner")
    .select("id, stripe_account_id, currency")
    .not("stripe_account_id", "is", null);

  for (const acc of accounts ?? []) {
    const stripeBal = await stripe.balance.retrieve(
      {},
      { stripeAccount: acc.stripe_account_id }
    );

    const stripeAmount =
      (stripeBal.available[0]?.amount ?? 0) +
      (stripeBal.pending[0]?.amount ?? 0);

    const { data: txns } = await supabase
      .from("ledger_transactions")
      .select("net_cents")
      .eq("earner_id", acc.id)
      .gte("created_at", `${day}T00:00:00Z`)
      .lte("created_at", `${day}T23:59:59Z`);

    const delta =
      txns?.reduce(
        (sum: number, t: { net_cents: number }) => sum + t.net_cents,
        0
      ) ?? 0;

    const { data: prev } = await supabase
      .from("ledger_balances")
      .select("balance_end_cents")
      .eq("account_id", acc.id)
      .eq("account_type", "earner")
      .lt("date", day)
      .order("date", { ascending: false })
      .limit(1);

    const start = prev?.[0]?.balance_end_cents ?? 0;
    const expected = start + delta;

    await supabase.from("ledger_balances").upsert(
      {
        date: day,
        account_id: acc.id,
        account_type: "earner",
        currency: acc.currency ?? "CHF",
        balance_start_cents: start,
        balance_end_cents: stripeAmount,
        matched: expected === stripeAmount,
        delta_cents: delta,
      },
      { onConflict: "date,account_id,account_type" }
    );
  }

  return new Response(JSON.stringify({ ok: true, day }), {
    headers: { "Content-Type": "application/json" },
  });
});

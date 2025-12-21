import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const key = req.headers.get("x-ledger-key");
  if (key !== process.env.LEDGER_INTERNAL_KEY) {
    return new Response("Forbidden", { status: 403 });
  }

  const body = await req.json();
  const { type, day, stripeAccountId, accountId } = body;

  if (!type || !day) {
    return NextResponse.json({ ok: false, error: "invalid_request" });
  }

  try {
    /* -------------------------------------------------------------- */
    /* STRIPE BALANCE                                                 */
    /* -------------------------------------------------------------- */

    const stripeBal =
      type === "platform"
        ? await stripe.balance.retrieve()
        : await stripe.balance.retrieve({}, { stripeAccount: stripeAccountId });

    const balance_end_cents =
      (stripeBal.available[0]?.amount ?? 0) +
      (stripeBal.pending[0]?.amount ?? 0);

    /* -------------------------------------------------------------- */
    /* LEDGER DELTA                                                   */
    /* -------------------------------------------------------------- */

    const table =
      type === "platform"
        ? "ledger_platform_transactions"
        : "ledger_transactions";

    const query =
      type === "platform"
        ? supabase.from(table).select("net_cents")
        : supabase.from(table).select("net_cents").eq("earner_id", accountId);

    const { data: txs } = await query
      .gte("created_at", `${day}T00:00:00.000Z`)
      .lte("created_at", `${day}T23:59:59.999Z`);

    const delta_cents = (txs ?? []).reduce(
      (s, t) => s + (t.net_cents ?? 0),
      0
    );

    /* -------------------------------------------------------------- */
    /* PREVIOUS BALANCE                                               */
    /* -------------------------------------------------------------- */

    const balancesTable =
      type === "platform" ? "ledger_platform_balances" : "ledger_balances";

    const prevQuery =
      type === "platform"
        ? supabase.from(balancesTable).select("balance_end_cents")
        : supabase
            .from(balancesTable)
            .select("balance_end_cents")
            .eq("account_id", accountId)
            .eq("account_type", "earner");

    const { data: prev } = await prevQuery
      .lt("date", day)
      .order("date", { ascending: false })
      .limit(1);

    const balance_start_cents = prev?.[0]?.balance_end_cents ?? 0;
    const expected = balance_start_cents + delta_cents;

    return NextResponse.json({
      ok: true,
      currency: "CHF",
      balance_start_cents,
      balance_end_cents,
      delta_cents,
      matched: expected === balance_end_cents,
    });
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      error: err?.code ?? "reconcile_failed",
    });
  }
}

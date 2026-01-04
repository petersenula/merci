// supabase/functions/stripe_ledger_webhook/index.ts

declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
  env: { get: (key: string) => string | undefined };
};

// @ts-ignore
import Stripe from "npm:stripe@12.18.0";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ===============================
// INIT
// ===============================
const stripe = new Stripe(
  Deno.env.get("STRIPE_SECRET_KEY")!,
  { apiVersion: "2023-10-16" }
);

const webhookSecret =
  Deno.env.get("STRIPE_LEDGER_WEBHOOK_SECRET")!;

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

// ===============================
// LEDGER-RELEVANT EVENTS
// ===============================
const LEDGER_EVENTS = new Set([
  "balance.available",
  "balance_transaction.created",
  "customer_cash_balance_transaction.created",
]);

// ===============================
// WEBHOOK ENTRY
// ===============================
Deno.serve(async (req) => {
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return json({ ok: false, error: "Missing stripe-signature" }, 400);
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      webhookSecret
    );
  } catch (e: any) {
    console.error("❌ Invalid signature", e.message);
    return json({ ok: false, error: "Invalid signature" }, 400);
  }

  const supabase = getSupabase();

  // ===============================
  // IDEMPOTENCY CHECK
  // ===============================
  const { data: alreadyProcessed } = await supabase
    .from("stripe_webhook_events")
    .select("id")
    .eq("event_id", event.id)
    .maybeSingle();

  if (alreadyProcessed) {
    return json({ ok: true, duplicate: true });
  }

  // ===============================
  // STORE EVENT ID (LOCK)
  // ===============================
  const { error: lockErr } = await supabase
    .from("stripe_webhook_events")
    .insert({
      event_id: event.id,
      event_type: event.type,
      created_at: new Date().toISOString(),
    });

  if (lockErr) {
    console.error("❌ Failed to lock webhook event", lockErr);
    return json({ ok: false, error: "Idempotency lock failed" }, 500);
  }

  // ===============================
  // FILTER EVENTS
  // ===============================
  if (!LEDGER_EVENTS.has(event.type)) {
    return json({ ok: true, ignored: true });
  }

  // ===============================
  // RESOLVE STRIPE ACCOUNT
  // ===============================
  // platform → event.account === undefined
  // connected → event.account === "acct_..."
  const stripeAccountId =
    (event as any).account ?? null;

  // ===============================
  // ENQUEUE LEDGER SYNC JOB
  // ===============================
  const payload =
    stripeAccountId === null
      ? {
          mode: "platform",
          source: "webhook",
          event_type: event.type,
        }
      : {
          mode: "connected",
          stripe_account_id: stripeAccountId,
          source: "webhook",
          event_type: event.type,
        };

  const { error } = await supabase.functions.invoke(
    "ledger_mark_dirty",
    { body: payload }
  );

  if (error) {
    console.error("❌ Failed to enqueue ledger job", error);
    return json({ ok: false, error: error.message }, 500);
  }

  return json({
    ok: true,
    queued: true,
    account: stripeAccountId ?? "platform",
    event: event.type,
  });
});

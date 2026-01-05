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
// LEDGER EVENTS (CONNECTED ONLY)
// ===============================
const LEDGER_EVENTS = new Set([
  "charge.succeeded",
  "payment_intent.succeeded",
  "application_fee.created",
  "transfer.created",
]);

// ===============================
// WEBHOOK
// ===============================
Deno.serve(async (req) => {
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return json({ ok: false, error: "Missing stripe-signature" }, 400);
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
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
  // FILTER EVENTS EARLY
  // ===============================
  if (!LEDGER_EVENTS.has(event.type)) {
    return json({ ok: true, ignored: true });
  }

  // ===============================
  // EXTRACT STRIPE ACCOUNT ID (CORRECT)
  // ===============================
  const obj: any = (event.data as any)?.object ?? null;

  let stripeAccountId: string | null = null;

  if (obj?.destination) {
    stripeAccountId = obj.destination;
  }

  if (!stripeAccountId && obj?.transfer_data?.destination) {
    stripeAccountId = obj.transfer_data.destination;
  }

  if (!stripeAccountId) {
    return json({ ok: true, ignored: true });
  }

  // ===============================
  // IDEMPOTENCY LOCK (WITH ACCOUNT!)
  // ===============================
  const { error: lockErr } = await supabase
    .from("stripe_webhook_events")
    .upsert(
      {
        stripe_event_id: event.id,
        event_type: event.type,
        stripe_created_at: new Date(event.created * 1000).toISOString(),
        stripe_account_id: stripeAccountId,
      },
      {
        onConflict: "stripe_event_id",
        ignoreDuplicates: true,
      }
    );

  if (lockErr) {
    console.error("❌ Failed to lock webhook event", lockErr);
    return json({ ok: false, error: "Idempotency lock failed" }, 500);
  }

  // ===============================
  // ENQUEUE LEDGER JOB
  // ===============================
  const payload = {
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
    stripe_account_id: stripeAccountId,
    event: event.type,
  });
});

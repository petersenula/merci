declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
  env: {
    get: (key: string) => string | undefined;
  };
};

import { stripe } from "../ledger_shared.ts";
import { getSupabase } from "../ledger_shared.ts";

const webhookSecret = Deno.env.get("STRIPE_PUSH_WEBHOOK_SECRET")!;

Deno.serve(async (req: Request) => {
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return new Response("Missing signature", { status: 400 });
  }

  const body = await req.text();

  let event: any;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    return new Response(`Webhook error: ${err.message}`, { status: 400 });
  }

  if (event.type !== "payment_intent.succeeded") {
    return new Response(JSON.stringify({ ignored: true }));
  }

  const intent = event.data.object;

  const earnerId = intent.metadata.earner_id || null;
  const employerId = intent.metadata.employer_id || null;

  if (!earnerId && !employerId) {
    return new Response(JSON.stringify({ skipped: "no destination" }));
  }

  // берем supabase
  const supabase = getSupabase();

  // определяем user_id — для earners это id в profiles_earner, для employers — user_id
  const userId = earnerId ?? employerId;

  // ищем пуш подписку
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!subs) {
    return new Response(JSON.stringify({ ok: true, noSubscription: true }));
  }

  // отправляем пуш через edge function
  await fetch(
    `${Deno.env.get("SUPABASE_URL")}/functions/v1/send_push`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subscription: subs,
        title: "You received a tip!",
        body: `A new tip has arrived 🎉`,
        url: "/earn/dashboard"
      }),
    }
  );

  return new Response(JSON.stringify({ ok: true }));
});

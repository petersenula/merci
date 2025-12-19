declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

import { stripe, getSupabase } from "../ledger_shared.ts";

Deno.serve(async (req) => {
  const supabase = getSupabase();
  const url = new URL(req.url);

  // today всегда финальная дата snapshot
  const today = new Date().toISOString().slice(0, 10);

  // Параметры для ручного импорта
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");

  let fromTs: number;
  let toTs: number;

  if (fromParam && toParam) {
    // 📌 Ручной импорт
    const fromDate = new Date(fromParam + "T00:00:00Z");
    const toDate = new Date(toParam + "T23:59:59Z");

    fromTs = Math.floor(fromDate.getTime() / 1000);
    toTs = Math.floor(toDate.getTime() / 1000);
  } else {
    // 📌 Крон → rolling window: последние 3 дня
    const now = new Date();

    const fromDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 3)
    );

    const toDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );

    fromTs = Math.floor(fromDate.getTime() / 1000);
    toTs = Math.floor(toDate.getTime() / 1000);
  }

  // --- Основная логика сохраняется полностью ---
  const balance = await stripe.balance.retrieve();
  const amount = balance.available[0]?.amount ?? 0;

  await supabase.from("ledger_platform_balances").upsert(
    {
      date: today,
      balance_start_cents: amount,
      balance_end_cents: amount,
      currency: "CHF",
      created_at: new Date().toISOString(),
    },
    { onConflict: "date" },
  );

  return new Response(
    JSON.stringify({
      ok: true,
      balance: amount,
      fromTs,
      toTs,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});

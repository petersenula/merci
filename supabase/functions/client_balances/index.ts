declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

import { stripe, getSupabase } from "../ledger_shared.ts";

Deno.serve(async (req: Request) => {
  const supabase = getSupabase();
  const url = new URL(req.url);

  // Если from/to переданы → ручной режим
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");

  // Финальная дата снимка (всегда сегодняшний UTC день)
  const today = new Date().toISOString().slice(0, 10);

  // Расчёт рабочего окна (fromTs / toTs)
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
    toTs   = Math.floor(toDate.getTime() / 1000);
  }

  // ----------------------------
  //   Основная логика (не трогаем)
  // ----------------------------

  const accounts = await stripe.accounts.list({ limit: 100 });
  const results: any[] = [];

  for (const acc of accounts.data) {
    // 1. Берём баланс Stripe
    const bal = await stripe.balance.retrieve(
      {},
      { stripeAccount: acc.id }
    );

    const amount = bal.available[0]?.amount ?? 0;

    // 2. Определяем earners/employers
    let accountType: "earner" | "employer" | null = null;
    let internalId: string | null = null;

    // Сначала ищем среди earners
    const { data: earner } = await supabase
      .from("profiles_earner")
      .select("id")
      .eq("stripe_account_id", acc.id)
      .maybeSingle();

    if (earner?.id) {
      accountType = "earner";
      internalId = earner.id;
    }

    // Если не earner → ищем среди employers
    if (!internalId) {
      const { data: emp } = await supabase
        .from("employers")
        .select("user_id")
        .eq("stripe_account_id", acc.id)
        .maybeSingle();

      if (emp?.user_id) {
        accountType = "employer";
        internalId = emp.user_id;
      }
    }

    // Если ни earners, ни employers — пропускаем
    if (!internalId || !accountType) {
      results.push({
        account: acc.id,
        skipped: true,
        reason: "Not found in earners or employers",
      });
      continue;
    }

    // 3. Записываем баланс в ledger_balances
    await supabase.from("ledger_balances").upsert(
      {
        date: today,
        account_id: internalId,
        account_type: accountType,
        balance_start_cents: amount,
        balance_end_cents: amount,
        currency: "CHF",
        created_at: new Date().toISOString(),
      },
      {
        onConflict: "date,account_id,account_type",
      }
    );

    results.push({
      account: acc.id,
      mapped_to: internalId,
      type: accountType,
      amount,
      fromTs,
      toTs,
    });
  }

  return new Response(JSON.stringify({ ok: true, results }), {
    headers: { "Content-Type": "application/json" },
  });
});

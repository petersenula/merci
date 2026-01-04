declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
  env: { get: (key: string) => string | undefined };
};

// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function toDateString(d: Date) {
  return d.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  const supabase = getSupabase();

  const {
    start_date,
    end_date = null,
    account_type = null,
  } = await req.json();

  if (!start_date) {
    return json({ ok: false, error: "start_date is required" }, 400);
  }

  const startDate = new Date(start_date);
  const endDate = end_date ? new Date(end_date) : new Date();

  let currentDate = startDate;
  const results: any[] = [];

  while (currentDate <= endDate) {
    const day = toDateString(currentDate);
    const prevDay = toDateString(addDays(currentDate, -1));

    // ✅ FIX 1: touchedAccounts ОБЯЗАТЕЛЬНО на каждый день
    const touchedAccounts = new Set<string>();

    // --------------------------------------------------
    // 1️⃣ Дельты дня (RPC)
    // --------------------------------------------------
    const { data: deltas, error: deltaErr } = await supabase.rpc(
      "ledger_daily_deltas",
      {
        p_day: day,
        p_account_type: account_type,
      }
    );

    if (deltaErr) throw deltaErr;

    // --------------------------------------------------
    // 1.5️⃣ Если дельт НЕТ — переносим ВСЕ вчерашние балансы
    // --------------------------------------------------
    if (!deltas || deltas.length === 0) {
      let prevBalancesQuery = supabase
        .from("ledger_balances")
        .select("account_type, account_id, currency, balance_end_cents")
        .eq("date", prevDay);

      if (account_type) {
        prevBalancesQuery = prevBalancesQuery.eq("account_type", account_type);
      }

      const { data: prevBalances, error: prevBalancesErr } =
        await prevBalancesQuery;
      if (prevBalancesErr) throw prevBalancesErr;

      for (const b of prevBalances ?? []) {
        const { error: upsertErr } = await supabase
          .from("ledger_balances")
          .upsert(
            {
              date: day,
              account_type: b.account_type,
              account_id: b.account_id,
              currency: b.currency,
              balance_start_cents: b.balance_end_cents,
              balance_end_cents: b.balance_end_cents,
            },
            { onConflict: "date,account_type,account_id_norm,currency" }
          );

        if (upsertErr) throw upsertErr;

        results.push({
          date: day,
          account_type: b.account_type,
          account_id: b.account_id,
          currency: b.currency,
          balance_start: b.balance_end_cents,
          balance_end: b.balance_end_cents,
          note: "carry-forward (no transactions)",
        });
      }

      currentDate = addDays(currentDate, 1);
      continue;
    }

    // --------------------------------------------------
    // 2️⃣ Аккаунты С дельтами
    // --------------------------------------------------
    for (const row of deltas) {
      const {
        account_type,
        internal_account_id,
        currency,
        delta,
      } = row;

      let prevBalanceQuery = supabase
        .from("ledger_balances")
        .select("balance_end_cents")
        .eq("date", prevDay)
        .eq("account_type", account_type)
        .eq("currency", currency);

      prevBalanceQuery =
        internal_account_id == null
          ? prevBalanceQuery.is("account_id", null)
          : prevBalanceQuery.eq("account_id", internal_account_id);

      const { data: prevBalances, error: prevBalanceErr } =
        await prevBalanceQuery
          .order("date", { ascending: false })
          .limit(1);

      if (prevBalanceErr) throw prevBalanceErr;

      const prevBalance = prevBalances && prevBalances.length > 0
        ? prevBalances[0]
        : null;
      if (prevBalanceErr) throw prevBalanceErr;

      const balanceStart = prevBalance ? prevBalance.balance_end_cents : 0;
      const balanceEnd = balanceStart + Number(delta);

      const key = `${account_type}|${internal_account_id ?? "platform"}|${currency}`;
      touchedAccounts.add(key);

      const { error: upsertErr } = await supabase
        .from("ledger_balances")
        .upsert(
          {
            date: day,
            account_type,
            account_id: internal_account_id,
            currency,
            balance_start_cents: balanceStart,
            balance_end_cents: balanceEnd,
          },
          { onConflict: "date,account_type,account_id_norm,currency" }
        );

      if (upsertErr) throw upsertErr;

      results.push({
        date: day,
        account_type,
        account_id: internal_account_id,
        currency,
        balance_start: balanceStart,
        balance_end: balanceEnd,
        delta: Number(delta),
      });
    }

    // --------------------------------------------------
    // 3️⃣ ✅ FIX 2: carry-forward для аккаунтов БЕЗ дельт
    // --------------------------------------------------
    let prevBalancesQuery = supabase
      .from("ledger_balances")
      .select("account_type, account_id, currency, balance_end_cents")
      .eq("date", prevDay);

    if (account_type) {
      prevBalancesQuery = prevBalancesQuery.eq("account_type", account_type);
    }

    const { data: prevBalances, error: prevBalancesErr } =
      await prevBalancesQuery;
    if (prevBalancesErr) throw prevBalancesErr;

    for (const b of prevBalances ?? []) {
      const key = `${b.account_type}|${b.account_id ?? "platform"}|${b.currency}`;
      if (touchedAccounts.has(key)) continue;

      const { error: upsertErr } = await supabase
        .from("ledger_balances")
        .upsert(
          {
            date: day,
            account_type: b.account_type,
            account_id: b.account_id,
            currency: b.currency,
            balance_start_cents: b.balance_end_cents,
            balance_end_cents: b.balance_end_cents,
          },
          { onConflict: "date,account_type,account_id_norm,currency" }
        );

      if (upsertErr) throw upsertErr;

      results.push({
        date: day,
        account_type: b.account_type,
        account_id: b.account_id,
        currency: b.currency,
        balance_start: b.balance_end_cents,
        balance_end: b.balance_end_cents,
        note: "carry-forward (no delta)",
      });
    }

    currentDate = addDays(currentDate, 1);
  }

  return json({
    ok: true,
    start_date,
    end_date: end_date ?? "today",
    processed_rows: results.length,
    results,
  });
});

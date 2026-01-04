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

function resolveDate(input: string | null): Date | null {
  if (!input) return null;

  const now = new Date();

  if (input === "today") {
    return new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate()
      )
    );
  }

  if (input === "yesterday") {
    return new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() - 1
      )
    );
  }

  const d = new Date(input);
  if (isNaN(d.getTime())) {
    throw new Error(`Invalid date: ${input}`);
  }

  return d;
}

Deno.serve(async (req) => {
  const supabase = getSupabase();

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON" }, 400);
  }

  const {
    start_date,
    end_date = null,
    account_type = null,
  } = body;

  if (!start_date) {
    return json({ ok: false, error: "start_date is required" }, 400);
  }

  let startDate: Date;
  let endDate: Date;

  try {
    startDate = resolveDate(start_date)!;
    endDate = resolveDate(end_date) ?? new Date();
  } catch (e: any) {
    return json({ ok: false, error: e.message }, 400);
  }

  let currentDate = startDate;
  const results: any[] = [];

  while (currentDate <= endDate) {
    const day = toDateString(currentDate);
    const prevDay = toDateString(addDays(currentDate, -1));

    const touchedAccounts = new Set<string>();

    // --------------------------------------------------
    // 1️⃣ Дельты дня
    // --------------------------------------------------
    const { data: deltas, error: deltaErr } = await supabase.rpc(
      "ledger_daily_deltas",
      {
        p_day: day,
        p_account_type: account_type,
      }
    );

    if (deltaErr) {
      return json({ ok: false, error: deltaErr.message }, 500);
    }

    // --------------------------------------------------
    // 1.5️⃣ Нет дельт — переносим вчерашние балансы
    // --------------------------------------------------
    if (!deltas || deltas.length === 0) {
      let prevBalancesQuery = supabase
        .from("ledger_balances")
        .select("account_type, account_id, currency, balance_end_cents")
        .eq("date", prevDay);

      if (account_type) {
        prevBalancesQuery = prevBalancesQuery.eq("account_type", account_type);
      }

      const { data: prevBalances, error: prevErr } =
        await prevBalancesQuery;

      if (prevErr) {
        return json({ ok: false, error: prevErr.message }, 500);
      }

      for (const b of prevBalances ?? []) {
        await supabase.from("ledger_balances").upsert(
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
      }

      currentDate = addDays(currentDate, 1);
      continue;
    }

    // --------------------------------------------------
    // 2️⃣ Аккаунты с дельтами
    // --------------------------------------------------
    for (const row of deltas) {
      const { account_type, internal_account_id, currency, delta } = row;

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

      const { data: prevBalances } = await prevBalanceQuery.limit(1);

      const prevBalance =
        prevBalances && prevBalances.length > 0
          ? prevBalances[0].balance_end_cents
          : 0;

      const balanceEnd = prevBalance + Number(delta);

      const key = `${account_type}|${internal_account_id ?? "platform"}|${currency}`;
      touchedAccounts.add(key);

      await supabase.from("ledger_balances").upsert(
        {
          date: day,
          account_type,
          account_id: internal_account_id,
          currency,
          balance_start_cents: prevBalance,
          balance_end_cents: balanceEnd,
        },
        { onConflict: "date,account_type,account_id_norm,currency" }
      );
    }

    // --------------------------------------------------
    // 3️⃣ carry-forward для аккаунтов без дельт
    // --------------------------------------------------
    let prevBalancesQuery = supabase
      .from("ledger_balances")
      .select("account_type, account_id, currency, balance_end_cents")
      .eq("date", prevDay);

    if (account_type) {
      prevBalancesQuery = prevBalancesQuery.eq("account_type", account_type);
    }

    const { data: prevBalances } = await prevBalancesQuery;

    for (const b of prevBalances ?? []) {
      const key = `${b.account_type}|${b.account_id ?? "platform"}|${b.currency}`;
      if (touchedAccounts.has(key)) continue;

      await supabase.from("ledger_balances").upsert(
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
    }

    currentDate = addDays(currentDate, 1);
  }

  return json({
    ok: true,
    start_date,
    end_date: end_date ?? "today",
    processed_rows: results.length,
  });
});

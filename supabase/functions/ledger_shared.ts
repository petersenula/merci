declare const Deno: {
  env: {
    get: (key: string) => string | undefined;
  };
};

// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Stripe from "npm:stripe@12.18.0";

export const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);

// Клиент с service_role — обход RLS, максимум прав
export function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

/**
 * Стягиваем все Balance Transactions за период
 * accountId = null  → платформенный аккаунт
 * accountId = "acct_..." → connected account
 */
export async function fetchStripeLedgerPaged(
  accountId: string | null,
  fromTs: number,
  toTs: number
): Promise<Stripe.BalanceTransaction[]> {
  const all: Stripe.BalanceTransaction[] = [];
  let startingAfter: string | undefined = undefined;

  console.log("LEDGER_FETCH_START", { accountId, fromTs, toTs });

  while (true) {
    const page: Stripe.ApiList<Stripe.BalanceTransaction> =
      await stripe.balanceTransactions.list(
        {
          limit: 100,
          created: { gte: fromTs, lte: toTs },
          starting_after: startingAfter,
        },
        accountId ? { stripeAccount: accountId } : undefined
      );

    all.push(...page.data);

    if (!page.has_more) break;
    startingAfter = page.data[page.data.length - 1].id;
  }

  console.log("LEDGER_FETCH_DONE", { accountId, total: all.length });

  return all;
}

/**
 * Сохраняем пачку транзакций в нужную таблицу:
 * - platform (accountId=null) -> ledger_platform_transactions
 * - connected account         -> ledger_transactions
 *
 * ledger_entries УДАЛЕНА (ты её потом удалишь из БД)
 */
export async function saveLedgerItems(
  accountId: string | null,
  items: Stripe.BalanceTransaction[]
): Promise<number> {
  const supabase = getSupabase();
  let success = 0;

  for (const t of items) {
    const createdAtIso = new Date(t.created * 1000).toISOString();

    // Stripe fee (если нет — 0)
    const stripeFee =
      t.fee_details?.reduce((sum: number, f: Stripe.FeeDetail) => sum + f.amount, 0) ?? 0;

    // Stripe source id может быть string или object
    const sourceId =
      typeof t.source === "string" ? t.source : (t.source?.id ?? null);

    // -----------------------------
    // A) PLATFORM
    // -----------------------------
    if (!accountId) {
      const { error } = await supabase
        .from("ledger_platform_transactions")
        .upsert(
          {
            stripe_balance_transaction_id: t.id,
            type: t.type,
            reporting_category: t.reporting_category,
            currency: t.currency.toUpperCase(),
            amount_gross_cents: t.amount,
            net_cents: t.net,
            stripe_fee_cents: stripeFee,
            application_fee_cents: 0, // если нужно — добавим позже отдельным шагом
            created_at: createdAtIso,
            raw: JSON.parse(JSON.stringify(t)),
          },
          { onConflict: "stripe_balance_transaction_id" }
        );

      if (error) {
        console.error("PLATFORM TXN UPSERT ERROR:", error);
        continue;
      }

      success++;
      continue;
    }

    // -----------------------------
    // B) CONNECTED ACCOUNTS
    // -----------------------------
    // 1) маппинг accountId -> earner/employer
    let internalType: "earner" | "employer" | null = null;
    let internalId: string | null = null;

    const { data: earner } = await supabase
      .from("profiles_earner")
      .select("id")
      .eq("stripe_account_id", accountId)
      .maybeSingle();

    if (earner?.id) {
      internalType = "earner";
      internalId = earner.id;
    }

    if (!internalId) {
      const { data: emp } = await supabase
        .from("employers")
        .select("user_id")
        .eq("stripe_account_id", accountId)
        .maybeSingle();

      if (emp?.user_id) {
        internalType = "employer";
        internalId = emp.user_id;
      }
    }

    if (!internalId || !internalType) {
      console.log("Unknown stripe account → skip", accountId);
      continue;
    }

    // 2) пишем ledger_transactions
    const { error: txnErr } = await supabase
      .from("ledger_transactions")
      .upsert(
        {
          stripe_balance_transaction_id: t.id,
          earner_id: internalType === "earner" ? internalId : null,
          employer_id: internalType === "employer" ? internalId : null,
          stripe_object_id: sourceId,
          operation_type: t.type,
          reporting_category: t.reporting_category,
          currency: t.currency.toUpperCase(),
          amount_gross_cents: t.amount,
          net_cents: t.net,
          balance_after: t.balance ?? null,
          created_at: createdAtIso,
          raw: JSON.parse(JSON.stringify(t)),
        },
        { onConflict: "stripe_balance_transaction_id" }
      );

    if (txnErr) {
      console.error("CONNECTED TXN UPSERT ERROR:", txnErr);
      continue;
    }

    success++;
  }

  return success;
}

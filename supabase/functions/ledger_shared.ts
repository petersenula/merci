// supabase/functions/ledger_shared.ts

declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
  env: {
    get: (key: string) => string | undefined;
  };
};

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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

  console.log("LEDGER_FETCH_DONE", {
    accountId,
    total: all.length,
  });

  return all;
}

/**
 * ВСПОМОГАТЕЛЬНО: логируем, что за metadata вообще приходят
 * (чтобы понять, откуда брать earner_id / employer_id / scheme_id)
 */
function debugMetadata(bt: Stripe.BalanceTransaction) {
  const anyBt: any = bt;
  const src: any = bt.source ?? {};

  console.log("LEDGER_METADATA_DEBUG", {
    btId: bt.id,
    btType: bt.type,
    btMeta: anyBt.metadata ?? null,
    sourceType: src?.object ?? null,
    sourceId: src?.id ?? null,
    sourceMeta: src?.metadata ?? null,
  });
}

/**
 * Сохраняем пачку транзакций в таблицу ledger
 * Возвращаем КОЛИЧЕСТВО УСПЕШНО записанных строк
 */
export async function saveLedgerItems(
  accountId: string | null,
  items: Stripe.BalanceTransaction[]
): Promise<number> {
  const supabase = getSupabase();
  let success = 0;

  for (const t of items) {
    // 1. определяем earner/employer
    let internalType: "earner" | "employer" | null = null;
    let internalId: string | null = null;

    if (accountId) {
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

      if (!internalId) {
        console.log("Unknown stripe account → skip", accountId);
        continue;
      }
    }

    // 2. stripe fee details
    const stripeFee =
    t.fee_details?.reduce(
      (sum: number, f: Stripe.FeeDetail) => sum + f.amount,
      0
    )

    const txnDate = new Date(t.created * 1000).toISOString().slice(0, 10);

    // 3. ledger_transactions
    const { error: txnErr } = await supabase.from("ledger_transactions").upsert(
      {
        stripe_balance_transaction_id: t.id,
        earner_id: internalType === "earner" ? internalId : null,
        employer_id: internalType === "employer" ? internalId : null,
        stripe_object_id: t.source?.id ?? null,
        operation_type: t.type,
        reporting_category: t.reporting_category,
        currency: t.currency.toUpperCase(),
        amount_gross_cents: t.amount,
        net_cents: t.net,
        balance_after: t.balance ?? null,
        created_at: new Date(t.created * 1000).toISOString(),
        raw: t,
      },
      { onConflict: "stripe_balance_transaction_id" }
    );

    if (txnErr) {
      console.error("TXN UPSERT ERROR:", txnErr);
      continue;
    }

    // 4. ledger_entries
    await supabase.from("ledger_entries").upsert(
      {
        date: txnDate,
        account_id: internalId,
        account_type: internalType,
        stripe_txn_id: t.id,
        type: t.type,
        amount_cents: t.net, // net = gross - fee
        currency: t.currency.toUpperCase(),
        source_id: t.source?.id ?? null,
      },
      { onConflict: "stripe_txn_id" }
    );

    success++;
  }

  return success;
}


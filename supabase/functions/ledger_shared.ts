declare const Deno: {
  env: {
    get: (key: string) => string | undefined;
  };
};

// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-ignore
import Stripe from "npm:stripe@12.18.0";

export const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

// service_role client (обходит RLS)
export function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

/**
 * Stripe Balance Transactions paged
 * platform  -> accountId = undefined
 * connected -> accountId = "acct_..."
 */
export async function fetchStripeLedgerPaged(
  accountId?: string,
  startingAfter?: string | null,
  toTs?: number
): Promise<Stripe.BalanceTransaction[]> {
  const all: Stripe.BalanceTransaction[] = [];
  let cursor = startingAfter ?? undefined;

  while (true) {
    const page = await stripe.balanceTransactions.list(
      {
        limit: 100,
        ...(cursor ? { starting_after: cursor } : {}),
      },
      accountId ? { stripeAccount: accountId } : undefined
    );

    if (page.data.length === 0) break;

    for (const tx of page.data) {
      if (toTs && tx.created > toTs) {
        return all;
      }
      all.push(tx);
    }

    if (!page.has_more) break;
    cursor = page.data[page.data.length - 1].id;
  }

  return all;
}

/**
 * Save balance transactions
 * platform  -> ledger_platform_transactions
 * connected -> ledger_transactions
 */
export async function saveLedgerItems(
  stripeAccountId: string | undefined,
  items: Stripe.BalanceTransaction[]
): Promise<number> {
  const supabase = getSupabase();
  let success = 0;

  for (const t of items) {
    const createdAtIso = new Date(t.created * 1000).toISOString();

    const stripeFee =
      t.fee_details?.reduce(
        (sum: number, f: Stripe.FeeDetail) => sum + f.amount,
        0
      ) ?? 0;

    const sourceId =
      typeof t.source === "string" ? t.source : t.source?.id ?? null;

    // ---------------- ACCOUNT RESOLUTION ----------------
    let accountType: "platform" | "earner" | "employer" | "unknown";
    let internalAccountId: string | null = null;
    let stripeAccount: string;

    if (!stripeAccountId) {
      // PLATFORM
      accountType = "platform";
      stripeAccount = "platform";
    } else {
      stripeAccount = stripeAccountId;

      const { data: earner } = await supabase
        .from("profiles_earner")
        .select("id")
        .eq("stripe_account_id", stripeAccountId)
        .maybeSingle();

      if (earner?.id) {
        accountType = "earner";
        internalAccountId = earner.id;
      } else {
        const { data: emp } = await supabase
          .from("employers")
          .select("user_id")
          .eq("stripe_account_id", stripeAccountId)
          .maybeSingle();

        if (emp?.user_id) {
          accountType = "employer";
          internalAccountId = emp.user_id;
        } else {
          // ❗ НИКОГДА не теряем транзакции
          accountType = "unknown";
          internalAccountId = null;
        }
      }
    }

    const { error } = await supabase
      .from("ledger_transactions")
      .upsert(
        {
          stripe_balance_transaction_id: t.id,
          account_type: accountType,
          stripe_account_id: stripeAccount,
          internal_account_id: internalAccountId,
          stripe_object_id: sourceId,
          operation_type: t.type,
          reporting_category: t.reporting_category,
          currency: t.currency.toUpperCase(),
          amount_gross_cents: t.amount,
          net_cents: t.net,
          stripe_fee_cents: stripeFee,
          balance_after: typeof t.balance === "number" ? t.balance : null,
          created_at: createdAtIso,
          raw: JSON.parse(JSON.stringify(t)),
        },
        { onConflict: "stripe_balance_transaction_id" }
      );

    if (!error) success++;
  }

  return success;
}


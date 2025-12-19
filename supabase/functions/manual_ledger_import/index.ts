// supabase/functions/manual_ledger_import/index.ts
declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

import {
  fetchStripeLedgerPaged,
  saveLedgerItems,
  stripe,
} from "../ledger_shared.ts";

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const fromStr = url.searchParams.get("from");
    const toStr = url.searchParams.get("to");

    if (!fromStr || !toStr) {
      return new Response(
        JSON.stringify({ error: "Use ?from=YYYY-MM-DD&to=YYYY-MM-DD" }),
        { status: 400 }
      );
    }

    const from = new Date(fromStr);
    const to = new Date(toStr);

    const fromTs = Math.floor(from.getTime() / 1000);
    const toTs = Math.floor(to.getTime() / 1000);

    console.log("MANUAL_IMPORT_START", { from: fromStr, to: toStr });

    // 1) ПЛАТФОРМА
    const platformItems = await fetchStripeLedgerPaged(null, fromTs, toTs);
    const platformInserted = await saveLedgerItems(null, platformItems);

    // 2) CONNECTED ACCOUNTS
    const accounts = await stripe.accounts.list({ limit: 100 });

    let totalFromStripe = platformItems.length;
    let totalInserted = platformInserted;

    for (const acc of accounts.data) {
      const accountItems = await fetchStripeLedgerPaged(acc.id, fromTs, toTs);
      const accountInserted = await saveLedgerItems(acc.id, accountItems);

      totalFromStripe += accountItems.length;
      totalInserted += accountInserted;
    }

    console.log("MANUAL_IMPORT_DONE", {
      period: { from: fromStr, to: toStr },
      totalFromStripe,
      totalInserted,
      connectedAccounts: accounts.data.length,
    });

    return new Response(
      JSON.stringify({
        ok: true,
        fetched_from_stripe: totalFromStripe,
        inserted_into_db: totalInserted,
        connected_accounts: accounts.data.length,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (e) {
      console.error("MANUAL_IMPORT_FATAL_ERROR", e);
      return new Response(
        JSON.stringify({
          ok: false,
          error: String(e),
        }),
        { status: 500 }
      );
  }
});

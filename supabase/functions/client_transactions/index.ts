declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

import {
  fetchStripeLedgerPaged,
  saveLedgerItems,
  stripe,
} from "../ledger_shared.ts";

Deno.serve(async (req) => {
  const url = new URL(req.url);

  // Параметры from/to — если есть → ручной режим
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");

  let fromTs: number;
  let toTs: number;

  if (fromParam && toParam) {
    // 📌 Ручной импорт (как раньше)
    const fromDate = new Date(fromParam + "T00:00:00Z");
    const toDate = new Date(toParam + "T23:59:59Z");

    fromTs = Math.floor(fromDate.getTime() / 1000);
    toTs = Math.floor(toDate.getTime() / 1000);
  } else {
    // 📌 Крон → автоматические последние 3 дня (UTC)
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

  // --- Основная логика (не меняем) ---

  const accounts = await stripe.accounts.list({ limit: 100 });
  const results: any[] = [];

  for (const acc of accounts.data) {
    const items = await fetchStripeLedgerPaged(acc.id, fromTs, toTs);

    const count = await saveLedgerItems(acc.id, items);

    results.push({
      account: acc.id,
      count,
      fromTs,
      toTs,
    });
  }

  return new Response(JSON.stringify({ ok: true, results }), {
    headers: { "Content-Type": "application/json" },
  });
});

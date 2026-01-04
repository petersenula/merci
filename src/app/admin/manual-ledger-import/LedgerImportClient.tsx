"use client";

import { useState } from "react";

export default function LedgerImportClient() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const callApi = async () => {
    if (!confirm("Are you sure you want to recalculate balances?")) return;

    if (!from || !to) {
      setResult("Error: Please select both dates");
      return;
    }

    setLoading(true);
    setResult("");

    try {
      const res = await fetch("/api/admin/ledger/backfill-balances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_date: from,
          end_date: to,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Request failed");
      }

      setResult(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setResult("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const callBackfillTransactions = async () => {
    if (!confirm("Are you sure you want to enqueue transaction backfill jobs?")) {
      return;
    }

    setLoading(true);
    setResult("");

    try {
      // Переводим даты в unix seconds
      const fromTs = Math.floor(new Date(from).getTime() / 1000);
      const toTs = Math.floor(new Date(to).getTime() / 1000);

      const res = await fetch("/api/admin/ledger/backfill-transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_ts: fromTs,
          to_ts: toTs,
          limit: 50,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Request failed");
      }

      setResult(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setResult("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-10 space-y-6 bg-white text-black p-6 rounded shadow">
      <h1 className="text-2xl font-bold">Manual Ledger Import</h1>

      <div className="space-y-4">
        <div>
          <label className="font-medium">From:</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border px-3 py-2 rounded w-full"
          />
        </div>

        <div>
          <label className="font-medium">To:</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border px-3 py-2 rounded w-full"
          />
        </div>
      </div>

      <div className="space-y-3 pt-4">
        <button
          onClick={callApi}
          className="px-4 py-2 bg-blue-600 text-white rounded w-full"
          disabled={loading}
        >
          {loading ? "Processing..." : "Backfill Ledger Balances"}
        </button>

        <button
          onClick={callBackfillTransactions}
          className="px-4 py-2 bg-orange-600 text-white rounded w-full"
          disabled={loading}
        >
          {loading ? "Processing..." : "Backfill Transactions (Stripe)"}
        </button>
      </div>

      {result && (
        <pre className="bg-gray-100 p-3 rounded text-sm whitespace-pre-wrap mt-6">
          {result}
        </pre>
      )}
    </div>
  );
}

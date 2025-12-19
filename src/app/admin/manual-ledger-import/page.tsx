"use client";

import { useState } from "react";

export default function LedgerImportPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const callApi = async (endpoint: string) => {
    setLoading(true);
    setResult("");

    let url = `/api/manual-ledger/${endpoint}`;
    if (from && to) {
      url += `?from=${from}&to=${to}`;
    }

    try {
      const res = await fetch(url);
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setResult("Error: " + err.message);
    }

    setLoading(false);
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
          onClick={() => callApi("platform-transactions")}
          className="px-4 py-2 bg-blue-600 text-white rounded w-full"
          disabled={loading}
        >
          {loading ? "Processing..." : "Import Platform Transactions"}
        </button>

        <button
          onClick={() => callApi("platform-balances")}
          className="px-4 py-2 bg-blue-600 text-white rounded w-full"
          disabled={loading}
        >
          {loading ? "Processing..." : "Import Platform Balances"}
        </button>

        <button
          onClick={() => callApi("client-transactions")}
          className="px-4 py-2 bg-blue-600 text-white rounded w-full"
          disabled={loading}
        >
          {loading ? "Processing..." : "Import Client Transactions"}
        </button>

        <button
          onClick={() => callApi("client-balances")}
          className="px-4 py-2 bg-blue-600 text-white rounded w-full"
          disabled={loading}
        >
          {loading ? "Processing..." : "Import Client Balances"}
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

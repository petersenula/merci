"use client";

import { useState } from "react";

export default function TipPayment({
  earnerId,
  currency,
  rating,
  onAmountChange,
  onCreateIntent,   // ← сообщаем родителю, что клиент нажал Pay
  disabled,
}: {
  earnerId: string;
  currency: string;
  rating: number;
  onAmountChange?: (cents: number) => void;
  onCreateIntent: (amountCents: number, selectedCurrency: string) => void;
  disabled?: boolean;
}) {
  const [amount, setAmount] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState(currency ?? "CHF");
  const [activeQuick, setActiveQuick] = useState<number | null>(null);

  const currencies = ["CHF", "EUR", "USD", "GBP", "CNY"];
  const quickAmounts = [2, 5, 10, 15, 20, 30];

  function applyQuickAmount(v: number) {
    setAmount(String(v));
    setActiveQuick(v);
    onAmountChange?.(v * 100);
  }

  function handleAmountInput(val: string) {
    setAmount(val);
    setActiveQuick(null);
    onAmountChange?.(Math.round(Number(val) * 100) || 0);
  }

  function changeCurrency(cur: string) {
    setSelectedCurrency(cur);
    setActiveQuick(null);
    onAmountChange?.(Math.round(Number(amount) * 100) || 0);
  }

  function handlePayClick() {
    const cents = Math.round(Number(amount) * 100);
    if (!cents || cents < 100) {
      alert("Enter amount");
      return;
    }
    onCreateIntent(cents, selectedCurrency);
  }

  return (
    <div className="space-y-4 mt-6">
      {/* FAST BUTTONS */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        {quickAmounts.map((value) => (
          <button
            key={value}
            onClick={() => applyQuickAmount(value)}
            className={
              activeQuick === value
                ? "py-2 rounded-lg border bg-green-600 text-white border-green-600"
                : "py-2 rounded-lg border bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
            }
          >
            {value} {selectedCurrency}
          </button>
        ))}
      </div>

      {/* MANUAL INPUT */}
      <input
        type="number"
        value={amount}
        onChange={(e) => handleAmountInput(e.target.value)}
        placeholder={`0.00 ${selectedCurrency}`}
        className="w-full border border-slate-300 rounded-lg px-3 py-3 text-lg font-medium"
      />

      {/* CURRENCY */}
      <div className="flex justify-center gap-2 text-xs mt-1 mb-3">
        {currencies.map((cur) => (
          <button
            key={cur}
            onClick={() => changeCurrency(cur)}
            className={
              selectedCurrency === cur
                ? "px-3 py-1 rounded-lg border bg-green-600 text-white border-green-600"
                : "px-3 py-1 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100"
            }
          >
            {cur}
          </button>
        ))}
      </div>

      {/* FIRST CLICK → START STRIPE */}
      <button
        onClick={handlePayClick}
        disabled={disabled || !amount}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg disabled:opacity-50"
      >
        Pay
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useT } from "@/lib/translation";

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
    const { t } = useT();

  // Ограничение суммы: 1 CHF .. 10'000 CHF
  const MIN_CENTS = 100; // 1.00
  const MAX_CENTS = 1_000_000; // 10'000.00

  function toCents(val: string) {
    const n = Number(val);
    if (!Number.isFinite(n)) return 0;
    return Math.round(n * 100);
  }

  // Красивый формат денег (швейцарский формат)
  function formatMoneyCh(amount: number) {
    return amount.toLocaleString("de-CH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  // Безопасная подстановка в перевод (не зависит от библиотеки i18n)
  // Используем плоские ключи и плейсхолдеры: {min}, {max}, {currency}
  function trWithVars(key: string, vars: Record<string, string>) {
    let s = t(key);
    for (const [k, v] of Object.entries(vars)) {
      s = s.split(`{${k}}`).join(v);
    }
    return s;
  }
  const [amount, setAmount] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState(currency ?? "CHF");
  const [activeQuick, setActiveQuick] = useState<number | null>(null);
  const cents = toCents(amount);

  // Показываем предупреждение только если пользователь уже ввёл сумму (> 0)
  const isTooLow = cents > 0 && cents < MIN_CENTS;
  const isTooHigh = cents > MAX_CENTS;
  const isOutOfRange = isTooLow || isTooHigh;
  const currencies = ["CHF"];
  const quickAmounts = [2, 5, 10, 15, 20, 30];

  function applyQuickAmount(v: number) {
    setAmount(String(v));
    setActiveQuick(v);
    onAmountChange?.(v * 100);
  }

  function handleAmountInput(val: string) {
    // Разрешаем максимум 2 знака после точки/запятой
    const normalized = val.replace(",", ".");
    const ok = /^\d*(\.\d{0,2})?$/.test(normalized);
    if (!ok) return;

    setAmount(normalized);
    setActiveQuick(null);
    onAmountChange?.(toCents(normalized) || 0);
  }

  function changeCurrency(cur: string) {
    setSelectedCurrency(cur);
    setActiveQuick(null);
    onAmountChange?.(Math.round(Number(amount) * 100) || 0);
  }

  function handlePayClick() {
    const cents = toCents(amount);

    if (!cents) {
      alert(t("tip_enter_amount"));
      return;
    }

    // Если сумма вне диапазона — ничего не делаем.
    // Пользователь увидит предупреждение на экране, и кнопка Pay будет disabled.
    if (cents < MIN_CENTS || cents > MAX_CENTS) {
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

      {/* WARNING: показываем только если сумма вне диапазона */}
      {isOutOfRange && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
          <p className="text-amber-900 text-sm font-medium">
            {trWithVars("tip_amount_range_title", {
              min: formatMoneyCh(1),
              max: formatMoneyCh(10_000),
              currency: selectedCurrency,
            })}
          </p>

          <p className="text-amber-800 text-xs mt-1">
            {t("tip_amount_range_hint")}
          </p>
        </div>
      )}

      {/* CURRENCY 
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
      */}

      {/* FIRST CLICK → START STRIPE */}
      <button
        onClick={handlePayClick}
        disabled={disabled || !amount || isOutOfRange}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg disabled:opacity-50"
      >
        {t("tip_pay")}
      </button>
    </div>
  );
}

"use client";

import { useT } from "@/lib/translation";

type Props = {
  value: string;
  onChange: (newValue: string) => void;
};

const CURRENCIES = [
  { code: "CHF", nameKey: "CHF" },
  { code: "EUR", nameKey: "EUR" },
  { code: "USD", nameKey: "USD" },
];

export function CurrencySelect({ value, onChange }: Props) {
  const { t } = useT();

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{t("currency")}</label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
      >
        {CURRENCIES.map((curr) => (
          <option key={curr.code} value={curr.code}>
            {t(curr.nameKey)}
          </option>
        ))}
      </select>
    </div>
  );
}

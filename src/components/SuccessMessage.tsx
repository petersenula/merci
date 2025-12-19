"use client";

import React from "react";
import { CheckmarkAnimation } from "@/components/CheckmarkAnimation";
import { useT } from "@/lib/translation";

export default function SuccessMessage({
  amount,
  currency,
}: {
  amount?: number;
  currency?: string;
}) {
  const { t } = useT();
  const formattedAmount = ((amount ?? 0) / 100).toFixed(2);
  const formattedCurrency = (currency ?? "").toUpperCase();

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 animate-fadeIn">
      {/* Галочка */}
      <div className="mb-4 text-green-600">
        <CheckmarkAnimation />
      </div>

      {/* Заголовок */}
      <h2 className="text-xl font-semibold text-green-700 mb-1">
        {t("success_title")}
      </h2>

      {/* Сообщение */}
      <p className="text-slate-600 text-center leading-relaxed max-w-xs">
        {t("success_message")
          .replace("{amount}", formattedAmount)
          .replace("{currency}", formattedCurrency ?? "")}
      </p>
    </div>
  );
}

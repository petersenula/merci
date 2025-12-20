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
            {/* ───────────── */}
      {/* Soft CTA */}
      <div className="mt-8 w-full max-w-xs">
        <div className="border-t border-slate-200 pt-4 text-center text-sm text-slate-500">
            <p className="mb-1">
            {t("success_cta_text")}
            </p>

            <a
            href="/"
            className="text-green-600 hover:text-green-700 underline underline-offset-4"
            >
            {t("success_cta_link")}
            </a>
        </div>
      </div>
    </div>
  );
}

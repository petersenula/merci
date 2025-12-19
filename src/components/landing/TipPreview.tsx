"use client";

import { useT } from "@/lib/translation";
import ProgressBarSmart from "@/components/ProgressBarSmart";
import Image from "next/image";
import { useState } from "react";
import Button from '@/components/ui/button';

type TipPreviewProps = {
  name: string;
  imageUrl?: string;

  goalTitle?: string;
  goalAmountCents?: number;
  goalStartAmountCents?: number;
  goalEarnedSinceStart?: number;

  currency: string;
};

export default function TipPreview({
  name,
  imageUrl,

  goalTitle,
  goalAmountCents,
  goalStartAmountCents = 0,
  goalEarnedSinceStart = 0,

  currency,
}: TipPreviewProps) {
  const { t } = useT();
  const currencies = ["CHF", "EUR", "USD", "GBP", "CNY"];
  const [selectedCurrency, setSelectedCurrency] = useState(currency ?? "CHF");
  const avatarScale = 1.3;

  return (
    <div className="w-full max-w-sm bg-white rounded-[2rem] shadow-xl border border-slate-200 px-6 py-8 mx-auto relative pointer-events-none opacity-90">

      {/* NOTCH */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-1.5 bg-slate-300 rounded-full" />

      {/* LOGO */}
      <div className="flex justify-center mb-4">
        <Image src="/images/logo.png" width={160} height={40} alt="click4tip" />
      </div>

      {/* LANGUAGE SELECTOR (visual only) */}
      <div className="flex justify-center gap-2 mb-4">
        {["EN", "DE", "FR", "IT", "ES", "中文"].map((lang, i) => (
          <div
            key={lang}
            className={`px-3 py-1 rounded-full border text-xs font-medium ${
              i === 0
                ? "bg-[#E8F5ED] text-green-700 border-green-300"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {lang}
          </div>
        ))}
      </div>

      {/* WELCOME MESSAGE */}
      <p className="text-center text-sm text-slate-700 mb-4">
        {t("tip_welcome_message")}
      </p>

      {/* LOGO / AVATAR */}
      <div className="flex justify-center mb-2">
        {imageUrl ? (
          <div className="relative w-28 h-28 rounded-full border border-slate-300 overflow-hidden bg-white">
            <Image
              src={imageUrl}
              alt={name}
              fill
              sizes="112px"
              // ВАЖНО: тут НЕТ rounded-full
              className="object-cover"
              style={{
                transform: "scale(1.2)", // 👈 меньше = дальше = больше лица влезает
                transformOrigin: "center",
              }}
            />
          </div>
        ) : (
          <div className="w-28 h-28 rounded-full bg-slate-300" />
        )}
      </div>

      {/* NAME */}
      <p className="text-center text-lg font-semibold text-slate-900 mb-3">
        {name}
      </p>

      {/* GOAL */}
      {goalTitle && (
        <p className="text-center text-sm text-slate-700 mb-3 leading-tight">
          {t("tip_goal_phrase")} {goalTitle}
        </p>
      )}

      <p className="text-center text-xs text-slate-400 mb-2">
        debug: goalAmountCents={String(goalAmountCents)}
      </p>

      {/* PROGRESS BAR */}
      {goalTitle && typeof goalAmountCents === "number" ? (
        <ProgressBarSmart
          goalAmountCents={goalAmountCents}
          goalStartAmount={goalStartAmountCents ?? 0}
          goalEarnedSinceStart={goalEarnedSinceStart ?? 0}
          currentTipCents={0}
          currency={currency}
        />
      ) : null}

      {/* RATING */}
      <p className="text-center text-sm text-slate-700 mb-2">
        {t("rating_title")}
      </p>

      <div className="flex justify-center gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="text-yellow-400 text-xl">
            ★
          </div>
        ))}
      </div>

      {/* QUICK AMOUNTS (disabled) */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {["2", "5", "10", "15", "20", "30"].map((val) => (
          <button
            key={val}
            className="py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm"
          >
            {val} {currency}
          </button>
        ))}
      </div>

      {/* MANUAL INPUT (disabled) */}
      <input
        disabled
        type="number"
        placeholder={`0.00 ${currency}`}
        className="w-full border border-slate-300 rounded-lg px-3 py-3 text-lg font-medium mb-3 bg-slate-100"
      />
      {/* CURRENCY */}
      <div className="flex justify-center gap-2 text-xs mt-1 mb-3">
        {currencies.map((cur) => {
          const isActive = cur === "CHF";

          return (
            <button
              key={cur}
              type="button"
              disabled
              className={
                isActive
                  ? "px-3 py-1 rounded-lg border bg-[#1FB94A] text-white border-[#1FB94A]"
                  : "px-3 py-1 rounded-lg border border-slate-300 text-slate-500 bg-slate-100"
              }
            >
              {cur}
            </button>
          );
        })}
      </div>
      {/* PAY BUTTON (disabled look) */}
      <Button variant="green" className="w-full bg-green-600 text-white font-medium py-3 rounded-lg opacity-70">
        Pay
      </Button>
    </div>
  );
}

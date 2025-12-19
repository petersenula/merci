"use client";

import Image from "next/image";
import ProgressBarSmart from "@/components/ProgressBarSmart";
import StarRating from "@/components/StarRating";
import { useT } from "@/lib/translation";

type Props = {
  name: string;
  avatar: string | null;

  goalTitle: string | null;
  goalAmountCents: number | null;
  goalStartAmount: number;
  goalEarnedSinceStart: number;

  currency: string;

  // NEW — флаги
  showGoal?: boolean;
  showGoalAmount?: boolean;
  showProgress?: boolean;
};

export default function PaymentPreview({
  name,
  avatar,
  goalTitle,
  goalAmountCents,
  goalStartAmount,
  goalEarnedSinceStart,
  currency,

  // значения по умолчанию, если флаги отсутствуют
  showGoal = true,
  showGoalAmount = true,
  showProgress = true,
}: Props) {
  const { t, lang } = useT();

  const languages = [
    { code: "en", label: "EN" },
    { code: "de", label: "DE" },
    { code: "fr", label: "FR" },
    { code: "it", label: "IT" },
    { code: "es", label: "ES" },
    { code: "zh", label: "中文" },
  ];

  return (
    <div className="w-full max-w-sm bg-white rounded-[2rem] shadow-xl px-6 py-8 mx-auto relative">

      {/* NOTCH */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-1.5 bg-slate-300 rounded-full" />

      {/* LOGO */}
      <div className="flex justify-center mb-4">
        <Image src="/images/logo.png" width={160} height={40} alt="click4tip" />
      </div>

      {/* LANGUAGES (disabled in preview) */}
      <div className="flex justify-center gap-2 mb-4 pointer-events-none opacity-60">
        {languages.map((l) => (
          <button
            key={l.code}
            className={
              lang === l.code
                ? "px-3 py-1 rounded-full bg-green-600 text-white text-xs font-medium shadow"
                : "px-3 py-1 rounded-full border border-slate-300 text-slate-600 text-xs"
            }
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* Welcome text */}
      <p className="text-center text-sm text-slate-700 mb-2">
        {t("tip_welcome_message")}
      </p>

      {/* Avatar */}
      <div className="flex justify-center mb-2">
        {avatar ? (
          <Image
            src={avatar}
            alt={name}
            width={80}
            height={80}
            className="rounded-full object-cover border"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-slate-300" />
        )}
      </div>

      {/* Name */}
      <h2 className="text-center text-lg font-semibold">
        {t("tip_im")} {name}
      </h2>

      {/* ============================== */}
      {/*        GOAL BLOCK              */}
      {/* ============================== */}

      {showGoal && (
        <>
          {/* Заголовок цели — всегда показываем, если цель включена */}
          {goalTitle && (
            <p className="text-center text-sm text-slate-600 mt-1">
              {t("tip_goal_phrase")} {goalTitle}
            </p>
          )}

          {/* ЛОГИКА ВИЗУАЛИЗАЦИИ */}
          {showProgress ? (
            // 1️⃣ ЕСЛИ ПРОГРЕСС ВКЛЮЧЕН → показываем только прогрессбар
            <ProgressBarSmart
              goalAmountCents={goalAmountCents ?? 0}
              goalStartAmount={goalStartAmount}
              goalEarnedSinceStart={goalEarnedSinceStart}
              currentTipCents={0}
              currency={currency}
            />
          ) : showGoalAmount ? (
            // 2️⃣ ЕСЛИ прогресс выключен, но сумма включена → показываем сумму
            <p className="text-center text-sm text-slate-700 mb-1">
              {(goalAmountCents ?? 0) / 100} {currency}
            </p>
          ) : null}
        </>
      )}

      {/* ============================== */}
      {/*        END GOAL BLOCK          */}
      {/* ============================== */}

      {/* Rating */}
      <p className="text-center text-sm text-slate-700 mb-1 mt-3">
        {t("rating_title")}
      </p>

      <div className="pointer-events-none opacity-70 mb-4">
        <StarRating value={5} onChange={() => {}} />
      </div>

      {/* Quick amounts */}
      <div className="grid grid-cols-3 gap-2 mb-3 pointer-events-none opacity-60">
        {["2", "5", "10", "15", "20", "30"].map((val) => (
          <button
            key={val}
            className="py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm"
          >
            {val} {currency}
          </button>
        ))}
      </div>

      {/* Manual input */}
      <input
        type="number"
        disabled
        placeholder={`0.00 ${currency}`}
        className="w-full border border-slate-300 rounded-lg px-3 py-3 text-lg font-medium mb-3 bg-slate-100"
      />

      {/* Pay button */}
      <button className="w-full bg-green-600 text-white font-medium py-3 rounded-lg opacity-50 pointer-events-none">
        Pay
      </button>
    </div>
  );
}

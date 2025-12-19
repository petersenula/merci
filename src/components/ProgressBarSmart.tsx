"use client";

type Props = {
  goalAmountCents: number;        // цель (в центах)
  goalStartAmount: number;        // стартовая сумма (в центах)
  goalEarnedSinceStart: number;   // заработано с даты X (в центах)
  currentTipCents?: number;       // вводимая сумма чаевых, в центах
  currency: string;               // "CHF" / "EUR"
  color?: string;           
};

export default function ProgressBarSmart({
  goalAmountCents,
  goalStartAmount,
  goalEarnedSinceStart,
  currentTipCents = 0,
  currency,
}: Props) {
  // 1. Складываем все суммы
  const total = 
    (goalStartAmount || 0) +
    (goalEarnedSinceStart || 0) +
    (currentTipCents || 0);

  // 2. Рассчитываем процент
  const percent = goalAmountCents
    ? Math.min(100, Math.round((total / goalAmountCents) * 100))
    : 0;

  // 3. Лейбл (переводим центы → валюту)
  const totalMoney = (total / 100).toFixed(2);
  const goalMoney = (goalAmountCents / 100).toFixed(2);
  const label = `${totalMoney} ${currency} / ${goalMoney} ${currency}`;

  return (
    <div className="mb-4 w-full">
      <div className="flex justify-between text-[11px] text-slate-600 mb-1">
        <span>Progress</span>
        <span>{label}</span>
      </div>

      <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
        <div
        className="h-full rounded-full"
        style={{
            width: `${percent}%`,
            backgroundColor: "var(--c4t-green)",
        }}
        />
      </div>
    </div>
  );
}

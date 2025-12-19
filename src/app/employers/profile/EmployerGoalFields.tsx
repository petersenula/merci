'use client';

import { useT } from "@/lib/translation";

type Props = {
  goalTitle: string;
  goalAmount: string;
  goalStartAmount: string;
  goalStartDate: string;
  currency: string;

  onGoalTitleChange: (value: string) => void;
  onGoalAmountChange: (value: string) => void;
  onGoalStartAmountChange: (value: string) => void;
  onGoalStartDateChange: (value: string) => void;
};

export function EmployerGoalFields({
  goalTitle,
  goalAmount,
  goalStartAmount,
  goalStartDate,
  currency,
  onGoalTitleChange,
  onGoalAmountChange,
  onGoalStartAmountChange,
  onGoalStartDateChange,
}: Props) {
  const { t } = useT();

  return (
    <div className="space-y-4">

      {/* Goal title */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          {t("goal.title")}
        </label>

        <input
          type="text"
          value={goalTitle}
          onChange={(e) => onGoalTitleChange(e.target.value)}
          placeholder={t("goal.titlePlaceholder")}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />

        <div className="rounded-lg bg-[#0DA067]/10 border border-[#0DA067]/30 p-3">
          <p className="text-sm font-medium text-[#0DA067]">
            {t("goal.descriptionTitle")}
          </p>
          <p className="text-sm text-[#0DA067]/90 mt-1 leading-snug">
            {t("goal.description1")}<br />
            {t("goal.description2")}<br />
            {t("goal.description5")}
          </p>
        </div>
      </div>

      {/* Goal amount */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          {t("goal.amount").replace("{currency}", currency)}
        </label>

        <input
          type="number"
          min="0"
          value={goalAmount}
          onChange={(e) => onGoalAmountChange(e.target.value)}
          placeholder={t("goal.amountPlaceholder")}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {/* Already saved amount */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          {t("profile.goalStart").replace("{currency}", currency)}
        </label>

        <input
          type="number"
          min="0"
          value={goalStartAmount}
          onChange={(e) => onGoalStartAmountChange(e.target.value)}
          placeholder="For example: 120"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />

        <div className="rounded-lg bg-[#0DA067]/10 border border-[#0DA067]/30 p-3">
          <p className="text-sm font-medium text-[#0DA067]">
            {t("profile.goalStartHelp")}
          </p>
        </div>
      </div>

      {/* Start date */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          {t("goal.startDate")}
        </label>

        <input
          type="date"
          value={goalStartDate}
          onChange={(e) => onGoalStartDateChange(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />

        <div className="rounded-lg bg-[#0DA067]/10 border border-[#0DA067]/30 p-3">
          <p className="text-sm font-medium text-[#0DA067]">
            {t("goal.startDateTitle")}
          </p>
          <p className="text-sm text-[#0DA067]/90 mt-1 leading-snug">
            {t("goal.startDateHelp")}
          </p>
        </div>
      </div>

    </div>
  );
}

'use client';

import { useState } from "react";
import type { Database } from "@/types/supabase";
import { Button } from "@/components/ui/button";
import DateRangeModal from "@/components/DateRangeModal";
import { Dropdown } from "@/components/ui/Dropdown";
import { getLast12Months, getLast52Weeks } from "@/utils/reportPeriods";
import { useT } from "@/lib/translation";

import EmployerAccountReport from "./EmployerAccountReport";
import EmployerTipsRatingsReport from "./EmployerTipsRatingsReport";

type EmployerProfile = Database["public"]["Tables"]["employers"]["Row"];

type Props = {
  profile: EmployerProfile;
};

export default function EmployerReports({ profile }: Props) {
  const { t } = useT();

  // Внутренние вкладки
  const [innerTab, setInnerTab] = useState<"account" | "tips">("account");

  // Общий выбор периода для обеих вкладок
  const [period, setPeriod] = useState("month");
  const [showCalendar, setShowCalendar] = useState(false);
  const [customRange, setCustomRange] = useState<{ from: string; to: string } | null>(null);

  const applyDateRange = (from: string, to: string) => {
    setShowCalendar(false);
    setPeriod("custom");
    setCustomRange({ from, to });
  };

  if (!t) return null;

  return (
    <div className="space-y-8">
      {/* ===== TITLE BLOCK ===== */}
      <div className="bg-white border rounded p-4 shadow-sm">
        <p>{t("step5_reports")}</p>
      </div>

      {/* ===== INNER TABS ===== */}
      <div className="inline-flex gap-2 rounded-lg bg-slate-100 p-1 border border-slate-200">
        <button
          type="button"
          onClick={() => setInnerTab("account")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2
            ${innerTab === "account"
              ? "bg-green-600 text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
            }`}
        >
          {t("report.tabAccount")}
        </button>

        <button
          type="button"
          onClick={() => setInnerTab("tips")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2
            ${innerTab === "tips"
              ? "bg-green-600 text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
            }`}
        >
          {t("report.tabTipsRatings")}
        </button>
      </div>

      {/* ===== PERIOD SELECT (общий) ===== */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-600">
          {t("report.choosePeriodTitle")}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Dropdown
            label={`${t("report.selectMonth")}`}
            placeholder={t("report.month")}
            value={period.startsWith("month:") ? period.replace("month:", "") : ""}
            onChange={(val) => {
              setPeriod("month:" + val);
              setCustomRange(null);
            }}
            options={getLast12Months().map((m) => ({
              code: m.value,
              label: m.label,
            }))}
          />

          <Dropdown
            label={`${t("report.selectWeek")}`}
            placeholder={t("report.week")}
            value={period.startsWith("week:") ? period.replace("week:", "") : ""}
            onChange={(val) => {
              setPeriod("week:" + val);
              setCustomRange(null);
            }}
            options={getLast52Weeks().map((w) => ({
              code: w.value,
              label: w.label,
            }))}
          />
        </div>

        <Button variant="outline" onClick={() => setShowCalendar(true)}>
          {t("report.changePeriod")}
        </Button>
      </div>

      {/* ===== PERIOD INFO ===== */}
      <div className="bg-white border rounded p-4 text-sm shadow-sm">
        <p className="text-slate-600">
          <strong>{t("report.period")}:</strong>{" "}
          {period === "custom" && customRange ? (
            `${new Date(customRange.from).toLocaleDateString()} — ${new Date(customRange.to).toLocaleDateString()}`
          ) : (
            // Тут просто показываем выбранный код периода,
            // а реальные даты покажут сами отчёты (они берут period из API)
            "—"
          )}
        </p>
      </div>

      {/* ===== CONTENT ===== */}
      {innerTab === "account" ? (
        <EmployerAccountReport profile={profile} period={period} customRange={customRange} />
      ) : (
        <EmployerTipsRatingsReport profile={profile} period={period} customRange={customRange} />
      )}

      {showCalendar && (
        <DateRangeModal onClose={() => setShowCalendar(false)} onApply={applyDateRange} />
      )}
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import type { Database } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import DateRangeModal from '@/components/DateRangeModal';
import { Dropdown } from "@/components/ui/Dropdown";
import { getLast12Months, getLast52Weeks } from "@/utils/reportPeriods";
import { useT } from "@/lib/translation";
import { Skeleton } from "@/components/ui/Skeleton";

type EmployerProfile = Database['public']['Tables']['employers']['Row'];

type Props = {
  profile: EmployerProfile;
};

type StripeRow = {
  id: string;
  type:
  | "charge"
  | "payout"
  | "refund"
  | "chargeback"
  | "adjustment"
  | "transfer_reversal"
  | "payout_reversal"
  | "application_fee_refund";
  gross: number;
  net: number;
  fee: number;
  currency: string;
  created: number;
  available_on?: number; 
  description?: string | null;
};

export default function EmployerReports({ profile }: Props) {
  const supabase = getSupabaseBrowserClient();
  const { t, lang } = useT();

  const [rows, setRows] = useState<StripeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('month');
  const [reportData, setReportData] = useState<any | null>(null);

  const [totals, setTotals] = useState({
    incoming: 0,
    outgoing: 0,
    balance: 0,
  });

  const [showCalendar, setShowCalendar] = useState(false);
  const [customRange, setCustomRange] = useState<{ from: string; to: string } | null>(null);

  const applyDateRange = (from: string, to: string) => {
    setShowCalendar(false);
    setPeriod('custom');
    setCustomRange({ from, to });
  };

  const load = async () => {
    setLoading(true);

    let url = `/api/employers/reports`;

    // Month
    if (period.startsWith("month:")) {
      const v = period.replace("month:", "");
      url += `?period=month&value=${v}`;
    }

    // Week
    else if (period.startsWith("week:")) {
      const v = period.replace("week:", "");
      url += `?period=week&value=${v}`;
    }

    // Custom range
    else if (customRange) {
      url += `?from=${customRange.from}&to=${customRange.to}`;
    }

    const {
      data: { session }
    } = await supabase.auth.getSession();

    const headers: HeadersInit = {};
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    // Fetch employer report
    const res = await fetch(url, { headers, credentials: "include" });
    const data = await res.json();
    setReportData(data);

    if (res.ok) {
      setRows(data.items);

    let incoming = 0;
    let outgoingAbs = 0;

    data.items.forEach((r: any) => {
      if (r.net > 0) {
        incoming += r.net;
      } else if (r.net < 0) {
        outgoingAbs += Math.abs(r.net);
      }
    });

      setTotals({
        incoming,
        outgoing: outgoingAbs,
        balance: incoming - outgoingAbs,
      });
    }

    setLoading(false);
  };

  // ===========================
  // XLS EXPORT
  // ===========================
  const handleDownloadXls = async () => {
    const win = window.open("", "_blank");

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const origin = window.location.origin;

    let url = `${origin}/api/employers/reports/export/xls?id=${profile.user_id}&lang=${lang}`;

    if (period.startsWith("month:")) {
      const value = period.replace("month:", "");
      url += `&period=month&value=${value}`;
    }
    else if (period.startsWith("week:")) {
      const value = period.replace("week:", "");
      url += `&period=week&value=${value}`;
    }
    else if (period === "custom" && customRange) {
      url += `&from=${customRange.from}&to=${customRange.to}`;
    }

    if (token) url += `&token=${token}`;

    win!.location.href = url;
  };

  // ===========================
  // PDF EXPORT
  // ===========================
  const handleDownloadPdf = async () => {
    const win = window.open("", "_blank");

    const { data: { session }} = await supabase.auth.getSession();
    const token = session?.access_token;
    const origin = window.location.origin;

    let url = `${origin}/api/employers/reports/export/pdf?id=${profile.user_id}&lang=${lang}`;

    if (period.startsWith("month:")) {
      const value = period.replace("month:", "");
      url += `&period=month&value=${value}`;
    }
    else if (period.startsWith("week:")) {
      const value = period.replace("week:", "");
      url += `&period=week&value=${value}`;
    }
    else if (period === "custom" && customRange) {
      url += `&from=${customRange.from}&to=${customRange.to}`;
    }

    if (token) url += `&token=${token}`;

    win!.location.href = url;
  };

  useEffect(() => {
    load();
  }, [period, customRange]);

  if (!t) return null;

  return (
    <div className="space-y-8">
      {/* ===== TITLE ===== */}

      <div className="bg-white border rounded p-4 shadow-sm">
        <p>{t("step5_reports")}</p>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-800">
          {t("report.operationsTitle")}
        </h2>

        <div className="flex flex-col items-end">
          <span className="text-sm text-slate-600">
            {t("report.currentBalanceTitle")}
          </span>

          {reportData?.totals ? (
            <span className="text-xl font-bold text-green-600">
              {((reportData.totals.balance || 0) / 100).toFixed(2)} {profile.currency}
            </span>
          ) : (
            <Skeleton className="h-6 w-24 mt-1" />
          )}
        </div>
      </div>

      {/* ===== PERIOD SELECT ===== */}
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
          {period !== "custom" ? (
            reportData?.period ? (
              `${new Date(reportData.period.from).toLocaleDateString()} — ${new Date(
                reportData.period.to
              ).toLocaleDateString()}`
            ) : "—"
          ) : customRange ? (
            `${new Date(customRange.from).toLocaleDateString()} — ${new Date(
              customRange.to
            ).toLocaleDateString()}`
          ) : "—"}
        </p>
      </div>

      {/* ===== TOTALS ===== */}
      <div className="bg-slate-50 border rounded p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 text-sm gap-4">
          <div>
            <strong>{t("report.incoming")}:</strong>{" "}
            {(totals.incoming / 100).toFixed(2)} {profile.currency}
          </div>

          <div>
            <strong>{t("report.outgoing")}:</strong>{" "}
            {(totals.outgoing / 100).toFixed(2)} {profile.currency}
          </div>

          <div>
            <strong>{t("report.totals")}:</strong>{" "}
            {(totals.balance / 100).toFixed(2)} {profile.currency}
          </div>
        </div>
      </div>

      {/* ===== OPERATIONS TABLE WITH SORTING ===== */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-medium text-slate-600">
            {t("report.operationsListTitle")}
          </h3>

          <div className="flex gap-2 text-slate-600">
            <button
              className="flex items-center gap-1 px-2 py-1 border border-slate-300 rounded-md hover:bg-slate-100 transition"
              onClick={() => {
                const sorted = [...rows].sort((a, b) => b.created - a.created);
                setRows(sorted);
              }}
            >
              <span>{t("report.sortByDate")}</span>
            </button>
            <button
              className="flex items-center gap-1 px-2 py-1 border border-slate-300 rounded-md hover:bg-slate-100 transition"
              onClick={() => {
                const sorted = [...rows].sort((a, b) => b.net - a.net);
                setRows(sorted);
              }}
            >
              <span>{t("report.sortByAmount")}</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading || !reportData ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="grid grid-cols-4 gap-4 items-center border-b py-3"
                >
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16 justify-self-end" />
                  <Skeleton className="h-4 w-16 justify-self-end" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ))}
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 border-b">
                  <tr>
                    <th className="p-2 text-left">{t("report.date")}</th>
                    <th className="p-2 text-right">{t("report.incoming")}</th>
                    <th className="p-2 text-right">{t("report.outgoing")}</th>
                    <th className="p-2 text-left">{t("report.description")}</th>
                    <th className="p-2 text-left">{t("report.availableOn")}</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-4 text-center text-slate-500 border-t"
                      >
                        {t("report.noData")}
                      </td>
                    </tr>
                  )}

                  {rows.map((r) => (
                    <tr key={r.id} className="border-b">
                      <td className="p-2">
                        {new Date(r.created * 1000).toLocaleString()}
                      </td>

                      <td className="p-2 text-right">
                        {r.net > 0 ? (r.net / 100).toFixed(2) : ""}
                      </td>

                      <td className="p-2 text-right">
                        {r.net < 0 ? (Math.abs(r.net) / 100).toFixed(2) : ""}
                      </td>

                      <td className="p-2">
                        {r.description && r.description !== ""
                          ? r.description
                          : t(`report.type.${r.type}`)}
                      </td>

                      <td className="p-2">
                        {r.available_on
                          ? new Date(r.available_on * 1000).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ===== EXPORT BUTTONS ===== */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleDownloadXls}>
          {t("report.downloadXls")}
        </Button>

        <Button variant="outline" onClick={handleDownloadPdf}>
          {t("report.downloadPdf")}
        </Button>
      </div>

      {showCalendar && (
        <DateRangeModal onClose={() => setShowCalendar(false)} onApply={applyDateRange} />
      )}
    </div>
  );
}
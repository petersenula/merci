'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import type { Database } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { useT } from "@/lib/translation";
import { Skeleton } from "@/components/ui/Skeleton";

type EmployerProfile = Database['public']['Tables']['employers']['Row'];

type Props = {
  profile: EmployerProfile;
  period: string;
  customRange: { from: string; to: string } | null;
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

export default function EmployerAccountReport({ profile, period, customRange }: Props) {
  const supabase = getSupabaseBrowserClient();
  const { t, lang } = useT();

  const [rows, setRows] = useState<StripeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any | null>(null);

  const [totals, setTotals] = useState({
    incoming: 0,
    outgoing: 0,
    balance: 0,
  });

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

    const { data: { session } } = await supabase.auth.getSession();

    const headers: HeadersInit = {};
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const res = await fetch(url, { headers, credentials: "include" });
    const data = await res.json();
    setReportData(data);

    if (res.ok) {
      setRows(data.items);

      let incoming = 0;
      let outgoingAbs = 0;

      data.items.forEach((r: any) => {
        if (r.net > 0) incoming += r.net;
        else if (r.net < 0) outgoingAbs += Math.abs(r.net);
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
    } else if (period.startsWith("week:")) {
      const value = period.replace("week:", "");
      url += `&period=week&value=${value}`;
    } else if (period === "custom" && customRange) {
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

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const origin = window.location.origin;

    let url = `${origin}/api/employers/reports/export/pdf?id=${profile.user_id}&lang=${lang}`;

    if (period.startsWith("month:")) {
      const value = period.replace("month:", "");
      url += `&period=month&value=${value}`;
    } else if (period.startsWith("week:")) {
      const value = period.replace("week:", "");
      url += `&period=week&value=${value}`;
    } else if (period === "custom" && customRange) {
      url += `&from=${customRange.from}&to=${customRange.to}`;
    }

    if (token) url += `&token=${token}`;

    win!.location.href = url;
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, customRange]);

  if (!t) return null;

  return (
    <div className="space-y-6">
      {/* ===== BALANCE ===== */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">
          {t("report.currentBalanceTitle")}
        </div>

        {reportData?.totals ? (
          <div className="text-xl font-bold text-green-600">
            {((reportData.totals.balance || 0) / 100).toFixed(2)} {profile.currency}
          </div>
        ) : (
          <Skeleton className="h-6 w-24 mt-1" />
        )}
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

      {/* ===== TABLE ===== */}
      <div className="overflow-x-auto">
        {loading || !reportData ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="grid grid-cols-4 gap-4 items-center border-b py-3">
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
                    <td colSpan={5} className="p-4 text-center text-slate-500 border-t">
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
                      {!r.description || r.description === ""
                        ? t("report.tipsLabel")
                        : r.description}
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

      {/* ===== EXPORT ===== */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleDownloadXls}>
          {t("report.downloadXls")}
        </Button>

        <Button variant="outline" onClick={handleDownloadPdf}>
          {t("report.downloadPdf")}
        </Button>
      </div>
    </div>
  );
}
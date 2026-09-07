'use client';

import { useEffect, useState } from "react";
import type { Database } from "@/types/supabase";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import { useT } from "@/lib/translation";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/button";

type EmployerProfile = Database["public"]["Tables"]["employers"]["Row"];

type Props = {
  profile: EmployerProfile;
  period: string;
  customRange: { from: string; to: string } | null;
};

type TipRow = {
  id: string;
  created_at: string;
  amount_net_cents: number;
  currency: string;
  review_rating: number | null;
  review_text: string | null;
  scheme_id: string | null;
  scheme_name: string | null;
};

export default function EmployerTipsRatingsReport({ profile, period, customRange }: Props) {
  const supabase = getSupabaseBrowserClient();
  const { t } = useT();

  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any | null>(null);
  const [rows, setRows] = useState<TipRow[]>([]);
  const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);

    let url = `/api/employers/reports/tips`;

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
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }

    const res = await fetch(url, { headers, credentials: "include" });
    const data = await res.json();

    setReportData(data);

    if (res.ok) {
      setRows(data.items || []);
    } else {
      setRows([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, customRange]);

  const handleDownloadPdf = async () => {
    const win = window.open("", "_blank");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const token = session?.access_token;
    const origin = window.location.origin;

    let url =
      `${origin}/api/employers/reports/tips/export/pdf?lang=${encodeURIComponent(
        localStorage.getItem("lang") || "en"
      )}`;

    if (period.startsWith("month:")) {
      const value = period.replace("month:", "");
      url += `&period=month&value=${encodeURIComponent(value)}`;
    } else if (period.startsWith("week:")) {
      const value = period.replace("week:", "");
      url += `&period=week&value=${encodeURIComponent(value)}`;
    } else if (period === "custom" && customRange) {
      url +=
        `&from=${encodeURIComponent(customRange.from)}` +
        `&to=${encodeURIComponent(customRange.to)}`;
    }

    if (token) {
      url += `&token=${encodeURIComponent(token)}`;
    }

    if (win) {
      win.location.href = url;
    }
  };

  const handleDownloadXls = async () => {
    const win = window.open("", "_blank");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const token = session?.access_token;
    const origin = window.location.origin;

    let url =
      `${origin}/api/employers/reports/tips/export/xls?lang=${encodeURIComponent(
        localStorage.getItem("lang") || "en"
      )}`;

    if (period.startsWith("month:")) {
      const value = period.replace("month:", "");
      url += `&period=month&value=${encodeURIComponent(value)}`;
    } else if (period.startsWith("week:")) {
      const value = period.replace("week:", "");
      url += `&period=week&value=${encodeURIComponent(value)}`;
    } else if (period === "custom" && customRange) {
      url +=
        `&from=${encodeURIComponent(customRange.from)}` +
        `&to=${encodeURIComponent(customRange.to)}`;
    }

    if (token) {
      url += `&token=${encodeURIComponent(token)}`;
    }

    if (win) {
      win.location.href = url;
    }
  };

  if (!t) return null;

  const tipsCount = reportData?.totals?.tipsCount ?? 0;
  const avgRating = reportData?.totals?.avgRating;
  const totalsByCurrency = reportData?.totals?.totalsByCurrency ?? {};

  return (
    <div className="space-y-6">
      {/* ===== TOTALS ===== */}
      <div className="bg-slate-50 border rounded p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 text-sm gap-4">
          <div>
            <strong>{t("report.tipsCount")}:</strong> {tipsCount}
          </div>

          <div>
            <strong>{t("report.tipsTotalNet")}:</strong>{" "}
            {Object.keys(totalsByCurrency).length === 0 ? (
              "—"
            ) : (
              <span className="inline-flex flex-wrap gap-x-3 gap-y-1">
                {Object.entries(totalsByCurrency).map(([cur, cents]) => (
                  <span key={cur}>
                    {(Number(cents) / 100).toFixed(2)} {cur}
                  </span>
                ))}
              </span>
            )}
          </div>
          <div>
            <strong>{t("report.avgRating")}:</strong>{" "}
            {typeof avgRating === "number" ? avgRating.toFixed(2) : "—"}
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
                  <th className="p-2 text-right">{t("report.netAmount")}</th>
                  <th className="p-2 text-left">{t("report.scheme")}</th>
                  <th className="p-2 text-left">{t("report.rating")}</th>
                  <th className="p-2 text-left">{t("report.review")}</th>
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
                      {new Date(r.created_at).toLocaleString()}
                    </td>

                    <td className="p-2 text-right">
                      {(r.amount_net_cents / 100).toFixed(2)} {r.currency?.toUpperCase()}
                    </td>

                    <td className="p-2">
                      {r.scheme_id
                        ? (r.scheme_name || "—")
                        : t("report.directTip")}
                    </td>

                    <td className="p-2">
                      {typeof r.review_rating === "number" ? r.review_rating : "—"}
                    </td>

                    <td className="p-2 max-w-xs text-slate-700 align-top">
                      {r.review_text?.trim() ? (
                        <div>
                          <div className="whitespace-pre-wrap break-words">
                            {expandedReviews[r.id] || r.review_text.trim().length <= 180
                              ? r.review_text.trim()
                              : `${r.review_text.trim().slice(0, 180).trimEnd()}…`}
                          </div>

                          {r.review_text.trim().length > 180 && (
                            <button
                              type="button"
                              className="mt-1 text-xs font-medium text-green-700 hover:underline"
                              onClick={() =>
                                setExpandedReviews((current) => ({
                                  ...current,
                                  [r.id]: !current[r.id],
                                }))
                              }
                            >
                              {expandedReviews[r.id]
                                ? t("report.showLess")
                                : t("report.showMore")}
                            </button>
                          )}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          type="button"
          onClick={handleDownloadXls}
        >
          {t("report.downloadXls")}
        </Button>

        <Button
          variant="outline"
          type="button"
          onClick={handleDownloadPdf}
        >
          {t("report.downloadPdf")}
        </Button>
      </div>
    </div>
  );
}
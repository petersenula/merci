// src/app/api/employers/reports/export/xls/route.ts
import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/authenticateApiRequest";
import ExcelJS from "exceljs";

// --------------------------------------------------
// LOAD TRANSLATIONS FROM PUBLIC
// --------------------------------------------------

async function loadTranslations(lang: string, req: NextRequest) {
const base =
    process.env.NEXT_PUBLIC_BASE_URL ||
    `${req.nextUrl.protocol}//${req.headers.get("host")}`;

const url = `${base}/locales/${lang}/translations.json`;

const res = await fetch(url, { cache: "no-store" });
if (!res.ok) throw new Error("Translations not found");

return await res.json();
}

// --------------------------------------------------
// LOAD REPORT (IDENTICAL TO PDF VERSION)
// --------------------------------------------------
async function loadReport(req: NextRequest) {
  const period = req.nextUrl.searchParams.get("period");
  const value = req.nextUrl.searchParams.get("value");
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");

  const params = new URLSearchParams();

  if (period && value) {
    params.set("period", period);
    params.set("value", value);
  } else if (from && to) {
    params.set("from", from);
    params.set("to", to);
  }

  let url = `${req.nextUrl.origin}/api/employers/reports`;
  const query = params.toString();

  if (query) {
    url += `?${query}`;
  }

  const res = await fetch(url, {
    headers: {
      Authorization: req.headers.get("authorization") ?? "",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to load employer report");
  }

  return await res.json();
}

// --------------------------------------------------
// XLS EXPORT
// --------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateApiRequest(req);

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // 1) Load employer report
    const report = await loadReport(req);

    // 2) Load translations
    const lang = req.nextUrl.searchParams.get("lang") || "en";
    const t = await loadTranslations(lang, req);

    // 3) Create workbook
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Report");

    // 4) Table header (как в workers)
    const header = [
      t["report.date"],
      t["report.incoming"],
      t["report.outgoing"],
      t["report.description"],
    ];

    sheet.addRow(header);
    sheet.getRow(1).font = { bold: true };

    sheet.columns = [
      { width: 15 },
      { width: 12 },
      { width: 12 },
      { width: 40 },
    ];

    // 5) Fill rows
    for (const row of report.items) {
      const date = new Date(row.created * 1000).toLocaleDateString();

      const incoming =
        row.type === "charge" ? (row.net / 100).toFixed(2) : "";

      const outgoing =
        row.type === "payout" ? (Math.abs(row.net) / 100).toFixed(2) : "";

      const desc = row.description || t["report.tipsLabel"];

      sheet.addRow([date, incoming, outgoing, desc]);
    }

    // 6) Export to XLSX buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="click4tip-employer-report.xlsx"',
      },
    });
  } catch (err: any) {
    console.error("EMPLOYER XLS ERROR:", err);
    return NextResponse.json(
      { error: "XLS generation failed", details: String(err) },
      { status: 500 }
    );
  }
}

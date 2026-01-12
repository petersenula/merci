import { NextRequest, NextResponse } from "next/server";
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
  const id = req.nextUrl.searchParams.get("id");
  const period = req.nextUrl.searchParams.get("period");
  const value = req.nextUrl.searchParams.get("value");
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  const token = req.nextUrl.searchParams.get("token");

  if (!id) throw new Error("Missing id");

  const base =
    process.env.NEXT_PUBLIC_BASE_URL ||
    `${req.nextUrl.protocol}//${req.headers.get("host")}`;

  let url = `${base}/api/earners/reports?id=${id}`;

  if (period && value) {
    url += `&period=${period}&value=${value}`;
  } else if (from && to) {
    url += `&from=${from}&to=${to}`;
  }

  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Failed to load report");

  return await res.json();
}

// --------------------------------------------------
// XLS EXPORT
// --------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    // 1) Load report
    const report = await loadReport(req);

    // 2) Load language
    const lang = req.nextUrl.searchParams.get("lang") || "en";
    const t = await loadTranslations(lang, req);

    // 3) Create workbook
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Report");

    // 4) Table header
    const header = [
    t["report.date"],
    t["report.incoming"],
    t["report.outgoing"],
    t["report.description"],
    t["report.rating"],
    ];


    sheet.addRow(header);
    sheet.getRow(1).font = { bold: true };

    sheet.columns = [
      { width: 15 },
      { width: 12 },
      { width: 12 },
      { width: 40 },
      { width: 10 },
    ];

    // 5) Fill rows
    for (const row of report.items) {
      const date = new Date(row.created * 1000).toLocaleDateString();

      const incoming =
        row.type === "transfer" ? (row.net / 100).toFixed(2) : "";

      const outgoing =
        row.type === "payout" ? (Math.abs(row.net) / 100).toFixed(2) : "";

      const desc = row.description || t["report.tipsLabel"];

      const rating =
      typeof row.review_rating === "number"
        ? String(row.review_rating)
        : "—";

      sheet.addRow([date, incoming, outgoing, desc, rating]);
    }

    // 6) Export to buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="click4tip-report.xlsx"',
      },
    });
  } catch (err: any) {
    console.error("XLS ERROR:", err);
    return NextResponse.json(
      { error: "XLS generation failed", details: String(err) },
      { status: 500 }
    );
  }
}

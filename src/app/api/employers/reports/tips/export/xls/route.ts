import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";

async function loadTranslations(lang: string, req: NextRequest) {
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ||
    `${req.nextUrl.protocol}//${req.headers.get("host")}`;

  const url = `${base}/locales/${lang}/translations.json`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Translations not found");

  return await res.json();
}

async function loadTipsReport(req: NextRequest) {
  const period = req.nextUrl.searchParams.get("period");
  const value = req.nextUrl.searchParams.get("value");
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  const token = req.nextUrl.searchParams.get("token");

  const base =
    process.env.NEXT_PUBLIC_BASE_URL ||
    `${req.nextUrl.protocol}//${req.headers.get("host")}`;

  let url = `${base}/api/employers/reports/tips`;

  const params = new URLSearchParams();

  if (period && value) {
    params.set("period", period);
    params.set("value", value);
  } else if (from && to) {
    params.set("from", from);
    params.set("to", to);
  }

  const qs = params.toString();
  if (qs) url += `?${qs}`;

  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to load tips report");
  }

  return await res.json();
}

export async function GET(req: NextRequest) {
  try {
    const report = await loadTipsReport(req);

    const lang = req.nextUrl.searchParams.get("lang") || "en";
    const t = await loadTranslations(lang, req);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Tips & Ratings");

    sheet.addRow([
      t["report.date"],
      t["report.netAmount"],
      t["currency"] || "Currency",
      t["report.scheme"],
      t["report.rating"],
      t["report.review"],
    ]);

    sheet.getRow(1).font = { bold: true };

    sheet.columns = [
      { width: 22 },
      { width: 14 },
      { width: 10 },
      { width: 28 },
      { width: 12 },
      { width: 55 },
    ];

    for (const row of report.items ?? []) {
      const date = new Date(row.created_at).toLocaleString();

      const excelRow = sheet.addRow([
        date,
        Number(row.amount_net_cents ?? 0) / 100,
        String(row.currency ?? "").toUpperCase(),
        row.scheme_name || t["report.directTip"] || "Direct tip",
        typeof row.review_rating === "number" ? row.review_rating : "",
        row.review_text || "",
      ]);

      excelRow.getCell(2).numFmt = "0.00";
      excelRow.getCell(6).alignment = {
        wrapText: true,
        vertical: "top",
      };
    }

    sheet.eachRow((row) => {
      row.alignment = {
        ...row.alignment,
        vertical: "top",
      };
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="click4tip-tips-ratings.xlsx"',
      },
    });
  } catch (error) {
    console.error("EMPLOYER TIPS XLS ERROR:", error);

    return NextResponse.json(
      { error: "Tips XLS generation failed" },
      { status: 500 }
    );
  }
}

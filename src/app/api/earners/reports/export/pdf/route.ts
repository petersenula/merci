import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

// --------------------------------------------------
// LOAD FONT / TRANSLATIONS FROM PUBLIC (VERCEL SAFE)
// --------------------------------------------------
async function loadFont(path: string) {
  const url = `${process.env.NEXT_PUBLIC_BASE_URL || ""}${path}`;
  const res = await fetch(url);
  return new Uint8Array(await res.arrayBuffer());
}

async function loadTranslations(lang: string) {
  const url = `${process.env.NEXT_PUBLIC_BASE_URL || ""}/locales/${lang}/translations.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Translations not found");
  return await res.json();
}

// --------------------------------------------------
// LOAD REPORT (MIRRORS UI REQUESTS 100%)
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

  // 🔥 URL строим ТОЧНО как в UI
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
// MAIN PDF ROUTE
// --------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const report = await loadReport(req);
    const lang = req.nextUrl.searchParams.get("lang") || "en";
    const t = await loadTranslations(lang);

    // LOAD ASSETS
    const fontRegular = await loadFont("/fonts/Roboto-Regular.ttf");
    const fontBold = await loadFont("/fonts/Roboto-Bold.ttf");
    const logoBytes = await loadFont("/images/logo.png");

    // CREATE PDF
    const pdf = await PDFDocument.create();
    pdf.registerFontkit(fontkit);

    let page = pdf.addPage([595, 842]); // 🔥 let — можно менять при переносе
    const { width } = page.getSize();

    const fReg = await pdf.embedFont(fontRegular);
    const fBold = await pdf.embedFont(fontBold);
    const logo = await pdf.embedPng(logoBytes);

    let y = 800;

    // LOGO
    page.drawImage(logo, { x: 40, y: y - 80, width: 140, height: 40 });
    y -= 100;

    // TITLE
    page.drawText(t["report.operationsTitle"], {
      x: 40,
      y,
      size: 22,
      font: fBold,
    });
    y -= 35;

    // PERIOD
    const periodFrom = new Date(report.period.from).toLocaleDateString();
    const periodTo = new Date(report.period.to).toLocaleDateString();

    page.drawText(`${t["report.period"]}: ${periodFrom} — ${periodTo}`, {
      x: 40,
      y,
      size: 12,
      font: fReg,
    });
    y -= 40;

    // TOTALS BOX
    page.drawRectangle({
      x: 30,
      y: y - 100,
      width: width - 60,
      height: 90,
      color: rgb(0.95, 0.95, 0.95),
      borderColor: rgb(0.85, 0.85, 0.85),
      borderWidth: 1,
    });

    const totals = [
      `${t["report.incoming"]}: ${(report.totals.totalIn / 100).toFixed(2)} ${report.currency}`,
      `${t["report.outgoing"]}: ${(report.totals.totalOut / 100).toFixed(2)} ${report.currency}`,
      `${t["report.totals"]}: ${((report.totals.totalIn - report.totals.totalOut) / 100).toFixed(2)} ${report.currency}`,
      `${t["report.currentBalanceTitle"]}: ${(report.totals.balance / 100).toFixed(2)} ${report.currency}`,
    ];

    let ty = y - 20;
    for (const line of totals) {
      page.drawText(line, { x: 40, y: ty, size: 12, font: fReg });
      ty -= 18;
    }

    y = ty - 40;

    // TABLE HEADER
    const header = [
      t["report.date"],
      t["report.incoming"],
      t["report.outgoing"],
      t["report.description"],
    ];
    const colX = [40, 150, 250, 350];

    header.forEach((h, i) =>
      page.drawText(h, { x: colX[i], y, size: 12, font: fBold })
    );

    y -= 20;

    // --------------------------------------------------
    // TABLE ROWS + PAGE BREAKS
    // --------------------------------------------------
    for (const row of report.items) {
      // NEW PAGE IF NEEDED
      if (y < 60) {
        page = pdf.addPage([595, 842]); // 🔥 перенос на новую страницу
        y = 800;

        // redraw header
        header.forEach((h, i) =>
          page.drawText(h, { x: colX[i], y, size: 12, font: fBold })
        );

        y -= 20;
      }

      const date = new Date(row.created * 1000).toLocaleDateString();
      const incoming =
        row.type === "charge" ? (row.net / 100).toFixed(2) : "";
      const outgoing =
        row.type === "payout" ? (Math.abs(row.net) / 100).toFixed(2) : "";
      const desc = row.description || t["report.tipsLabel"];

      const values = [date, incoming, outgoing, desc];

      values.forEach((v, i) =>
        page.drawText(String(v), {
          x: colX[i],
          y,
          size: 11,
          font: fReg,
        })
      );

      y -= 18;
    }

    // ✔ FINAL RESPONSE
    const pdfBytes = await pdf.save();

    // ✅ делаем ИМЕННО ArrayBuffer (не ArrayBufferLike)
    const arrayBuffer = new ArrayBuffer(pdfBytes.byteLength);
    new Uint8Array(arrayBuffer).set(pdfBytes);

    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="click4tip-report.pdf"`,
      },
    });

    } catch (err: any) {
      console.error("PDF ERROR:", err);
      return NextResponse.json(
        { error: "PDF generation failed", details: String(err) },
        { status: 500 },
      );
    }
  }

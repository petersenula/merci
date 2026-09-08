import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/authenticateApiRequest";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

async function loadAsset(path: string, req: NextRequest) {
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ||
    `${req.nextUrl.protocol}//${req.headers.get("host")}`;

  const res = await fetch(`${base}${path}`, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`Asset not found: ${path}`);
  }

  return new Uint8Array(await res.arrayBuffer());
}

async function loadTranslations(lang: string, req: NextRequest) {
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ||
    `${req.nextUrl.protocol}//${req.headers.get("host")}`;

  const res = await fetch(
    `${base}/locales/${lang}/translations.json`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error("Translations not found");
  }

  return await res.json();
}

async function loadTipsReport(req: NextRequest) {
  const period = req.nextUrl.searchParams.get("period");
  const value = req.nextUrl.searchParams.get("value");
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");

  let url = `${req.nextUrl.origin}/api/employers/reports/tips`;

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
    headers: {
      Authorization: req.headers.get("authorization") ?? "",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to load tips report");
  }

  return await res.json();
}

function wrapText(
  text: string,
  maxWidth: number,
  font: any,
  size: number
) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;

    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
      current = word;
    } else {
      lines.push(word);
      current = "";
    }
  }

  if (current) lines.push(current);

  return lines.length > 0 ? lines : [""];
}

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateApiRequest(req);

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const report = await loadTipsReport(req);

    const lang = req.nextUrl.searchParams.get("lang") || "en";
    const t = await loadTranslations(lang, req);

    const fontRegular = await loadAsset("/fonts/Roboto-Regular.ttf", req);
    const fontBold = await loadAsset("/fonts/Roboto-Bold.ttf", req);
    const logoBytes = await loadAsset("/images/logo.png", req);

    const pdf = await PDFDocument.create();
    pdf.registerFontkit(fontkit);

    const fReg = await pdf.embedFont(fontRegular);
    const fBold = await pdf.embedFont(fontBold);
    const logo = await pdf.embedPng(logoBytes);

    const PAGE_WIDTH = 595;
    const PAGE_HEIGHT = 842;
    const LEFT = 40;
    const RIGHT = 40;
    const CONTENT_WIDTH = PAGE_WIDTH - LEFT - RIGHT;

    let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let y = 800;

    const addHeader = () => {
      const logoWidth = 120;
      const logoScale = logoWidth / logo.width;

      page.drawImage(logo, {
        x: LEFT,
        y: y - logo.height * logoScale,
        width: logoWidth,
        height: logo.height * logoScale,
      });

      y -= 60;

      page.drawText(t["report.tabTipsRatings"] || "Tips & Ratings", {
        x: LEFT,
        y,
        size: 20,
        font: fBold,
      });

      y -= 28;

      const from = new Date(report.period.from).toLocaleDateString();
      const to = new Date(report.period.to).toLocaleDateString();

      page.drawText(
        `${t["report.period"] || "Period"}: ${from} — ${to}`,
        {
          x: LEFT,
          y,
          size: 10,
          font: fReg,
        }
      );

      y -= 30;
    };

    const ensureSpace = (needed: number) => {
      if (y - needed >= 50) return;

      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = 800;
      addHeader();
    };

    addHeader();

    const totalsByCurrency =
      report?.totals?.totalsByCurrency ?? {};

    const totalsText = Object.entries(totalsByCurrency)
      .map(
        ([currency, cents]) =>
          `${(Number(cents) / 100).toFixed(2)} ${currency}`
      )
      .join("   ");

    page.drawText(
      `${t["report.tipsCount"] || "Tips"}: ${
        report?.totals?.tipsCount ?? 0
      }`,
      {
        x: LEFT,
        y,
        size: 11,
        font: fBold,
      }
    );

    y -= 18;

    page.drawText(
      `${t["report.tipsTotalNet"] || "Net total"}: ${
        totalsText || "—"
      }`,
      {
        x: LEFT,
        y,
        size: 11,
        font: fReg,
      }
    );

    y -= 18;

    const avgRating = report?.totals?.avgRating;

    page.drawText(
      `${t["report.avgRating"] || "Average rating"}: ${
        typeof avgRating === "number"
          ? avgRating.toFixed(2)
          : "—"
      }`,
      {
        x: LEFT,
        y,
        size: 11,
        font: fReg,
      }
    );

    y -= 30;

    for (const row of report.items ?? []) {
      const review = String(row.review_text || "").trim();

      const reviewLines = review
        ? wrapText(
            `${t["report.review"] || "Review"}: ${review}`,
            CONTENT_WIDTH,
            fReg,
            10
          )
        : [];

      const blockHeight =
        24 +
        (reviewLines.length > 0
          ? reviewLines.length * 13 + 8
          : 0) +
        14;

      ensureSpace(blockHeight);

      const date = new Date(row.created_at).toLocaleString();
      const amount =
        `${(Number(row.amount_net_cents ?? 0) / 100).toFixed(2)} ` +
        `${String(row.currency ?? "").toUpperCase()}`;

      const scheme =
        row.scheme_name ||
        t["report.directTip"] ||
        "Direct tip";

      const rating =
        typeof row.review_rating === "number"
          ? String(row.review_rating)
          : "—";

      page.drawText(date, {
        x: LEFT,
        y,
        size: 10,
        font: fBold,
      });

      page.drawText(amount, {
        x: 205,
        y,
        size: 10,
        font: fBold,
      });

      page.drawText(scheme, {
        x: 300,
        y,
        size: 10,
        font: fReg,
        maxWidth: 170,
      });

      page.drawText(
        `${t["report.rating"] || "Rating"}: ${rating}`,
        {
          x: 475,
          y,
          size: 10,
          font: fReg,
        }
      );

      y -= 18;

      for (const line of reviewLines) {
        page.drawText(line, {
          x: LEFT,
          y,
          size: 10,
          font: fReg,
        });

        y -= 13;
      }

      y -= 4;

      page.drawLine({
        start: { x: LEFT, y },
        end: { x: PAGE_WIDTH - RIGHT, y },
        thickness: 0.5,
        color: rgb(0.85, 0.85, 0.85),
      });

      y -= 14;
    }

    const pdfBytes = await pdf.save();
    const buffer = new Uint8Array(pdfBytes).slice().buffer;

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'attachment; filename="click4tip-tips-ratings.pdf"',
      },
    });
  } catch (error) {
    console.error("EMPLOYER TIPS PDF ERROR:", error);

    return NextResponse.json(
      { error: "Tips PDF generation failed" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  context: { params: Promise<{ endpoint: string }> }
) {
  const { endpoint } = await context.params;

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ error: "Missing dates" }, { status: 400 });
  }

  const base = process.env.NEXT_PUBLIC_SUPABASE_FUNCTION_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!base) {
    return NextResponse.json(
      { error: "Missing env: NEXT_PUBLIC_SUPABASE_FUNCTION_URL" },
      { status: 500 }
    );
  }

  if (!key) {
    return NextResponse.json(
      { error: "Missing env: SUPABASE_SERVICE_ROLE_KEY" },
      { status: 500 }
    );
  }

  const functionUrl =
    `${base.replace(/\/$/, "")}/${endpoint}` +
    `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

  try {
    const res = await fetch(functionUrl, {
      headers: { Authorization: `Bearer ${key}` },
    });

    const text = await res.text();

    // Пытаемся распарсить JSON. Если не JSON — вернём текст как error.
    let data: any;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = {
        error: "Supabase function returned non-JSON response",
        endpoint,
        status: res.status,
        raw: text?.slice(0, 500) || "",
      };
    }

    // Чтобы отлаживать на проде: видно в Vercel logs
    if (!res.ok) {
      console.error("[manual-ledger] function error", {
        endpoint,
        status: res.status,
        functionUrl,
        raw: text?.slice(0, 1000),
      });
    }

    return NextResponse.json(data, { status: res.status });
  } catch (e: any) {
    console.error("[manual-ledger] fetch crashed", {
      endpoint,
      error: String(e),
    });

    return NextResponse.json(
      { error: "API route crashed", details: String(e) },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ error: "Missing dates" }, { status: 400 });
  }

  const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_FUNCTION_URL}/manual_ledger_import?from=${from}&to=${to}`;

  const res = await fetch(functionUrl, {
    headers: {
      // 🔥 главное: передаём service role key из сервера (НЕ в браузере!)
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });

  const data = await res.json();

  return NextResponse.json(data, { status: res.status });
}

import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ error: "Missing from/to" }, { status: 400 });
  }

  const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_FUNCTION_URL}/client_transactions?from=${from}&to=${to}`;

  const res = await fetch(functionUrl, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  let body: any;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { start_date, end_date, account_type = null } = body;

  if (!start_date) {
    return NextResponse.json(
      { error: "start_date is required" },
      { status: 400 }
    );
  }

  const base = process.env.NEXT_PUBLIC_SUPABASE_FUNCTION_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!base || !key) {
    return NextResponse.json(
      { error: "Missing server env vars" },
      { status: 500 }
    );
  }

  const functionUrl = `${base.replace(/\/$/, "")}/ledger_backfill_balances`;

  const res = await fetch(functionUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      start_date,
      end_date,
      account_type,
    }),
  });

  const text = await res.text();

  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    data = {
      error: "Supabase function returned non-JSON",
      raw: text,
    };
  }

  return NextResponse.json(data, { status: res.status });
}

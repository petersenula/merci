import { NextResponse } from "next/server";

export async function POST() {
  const base = process.env.NEXT_PUBLIC_SUPABASE_FUNCTION_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!base || !key) {
    return NextResponse.json(
      { error: "Missing server env vars" },
      { status: 500 }
    );
  }

  const functionUrl =
    `${base.replace(/\/$/, "")}/ledger_worker_sync`;

  const res = await fetch(functionUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
    },
  });

  const text = await res.text();

  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  return NextResponse.json(data, { status: res.status });
}

import { NextResponse } from "next/server";

export async function GET() {
  const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_FUNCTION_URL}/platform_balances`;

  const res = await fetch(functionUrl, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

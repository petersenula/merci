import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(
  req: Request,
  { params }: { params: { endpoint: string } }
) {
  const supabase = getSupabaseAdmin();

  // 1️⃣ параметры
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json(
      { error: "Missing dates" },
      { status: 400 }
    );
  }

  // 2️⃣ вызываем Edge Function
  const functionUrl =
    `${process.env.NEXT_PUBLIC_SUPABASE_FUNCTION_URL}/${params.endpoint}` +
    `?from=${from}&to=${to}`;

  const res = await fetch(functionUrl, {
    headers: {
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });

  const data = await res.json();

  return NextResponse.json(data, { status: res.status });
}

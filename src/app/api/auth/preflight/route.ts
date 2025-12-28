import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const supabaseAdmin = getSupabaseAdmin();

    // Быстро и масштабируемо: проверяем ТОЛЬКО user_index
    const { data: idx, error: idxErr } = await supabaseAdmin
      .from("user_index")
      .select("role")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (idxErr) {
      console.error("user_index lookup error:", idxErr);
      return NextResponse.json({ error: "INDEX_LOOKUP_FAILED" }, { status: 500 });
    }

    if (idx?.role === "earner") {
      return NextResponse.json({ scenario: "earner_existing" });
    }

    if (idx?.role === "employer") {
      return NextResponse.json({ scenario: "employer_existing" });
    }

    // email не найден в индексе → считаем "новый/неизвестный" и пробуем signUp
    return NextResponse.json({ scenario: "unknown" });
  } catch (err) {
    console.error("preflight error:", err);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
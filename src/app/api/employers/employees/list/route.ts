import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  const { employer_id } = await req.json();
  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from("employers_earners")
    .select("*, profiles_earner(*)")
    .eq("employer_id", employer_id)
    .eq("is_active", true); // ← ДОБАВИЛИ ТОЛЬКО ЭТО

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ employees: data });
}

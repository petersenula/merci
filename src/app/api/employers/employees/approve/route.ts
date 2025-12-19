import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  const { link_id } = await req.json();
  const supabaseAdmin = getSupabaseAdmin();

  const { error } = await supabaseAdmin
    .from("employers_earners")
    .update({
      pending: false,
      is_active: true
    })
    .eq("id", link_id);

  if (error) {
    console.error("EMPLOYEE APPROVE ERROR:", error);
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  const { relation_id } = await req.json();
  const supabaseAdmin = getSupabaseAdmin();

  const { error } = await supabaseAdmin
    .from("employers_earners")
    .delete()
    .eq("id", relation_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

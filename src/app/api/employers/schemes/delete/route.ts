import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const { scheme_id } = await req.json();
    const supabaseAdmin = getSupabaseAdmin();

    if (!scheme_id) {
      return NextResponse.json({ error: "Missing scheme_id" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("allocation_schemes")
      .delete()
      .eq("id", scheme_id);

    if (error) {
      console.error("DELETE SCHEME ERROR:", error);
      return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("SERVER DELETE ERROR:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

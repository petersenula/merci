import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { scheme_id, name, active_from, active_to } = await req.json();

    if (!scheme_id) {
      return NextResponse.json({ error: "Missing scheme_id" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("allocation_schemes")
      .update({
        name,
        active_from: active_from || null,
        active_to: active_to || null,
      })
      .eq("id", scheme_id);

    if (error) {
      console.error("UPDATE ERROR:", error);
      return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("UPDATE SERVER ERROR:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

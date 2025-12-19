import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const { employer_id, earner_id, share_page_access } = await req.json();
    const supabaseAdmin = getSupabaseAdmin();

    if (!employer_id || !earner_id) {
      return NextResponse.json({ error: "Missing IDs" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("employers_earners")
      .update({
        share_page_access
      })
      .eq("employer_id", employer_id)
      .eq("earner_id", earner_id);

    if (error) {
      console.error("UPDATE ERROR:", error);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("SERVER ERROR:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

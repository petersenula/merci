import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/authenticateApiRequest";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateApiRequest(req);

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { scheme_id, name, active_from, active_to } = await req.json();

    if (!scheme_id) {
      return NextResponse.json({ error: "Missing scheme_id" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data, error } = await supabaseAdmin
      .from("allocation_schemes")
      .update({
        name,
        active_from: active_from || null,
        active_to: active_to || null,
      })
      .eq("id", scheme_id)
      .eq("employer_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("UPDATE ERROR:", error);
      return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "Scheme not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("UPDATE SERVER ERROR:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

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

    const { employer_id, share_page_access } = await req.json();
    const supabaseAdmin = getSupabaseAdmin();

    if (!employer_id || typeof share_page_access !== "boolean") {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("employers_earners")
      .update({
        share_page_access
      })
      .eq("employer_id", employer_id)
      .eq("earner_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("UPDATE ERROR:", error);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "Relationship not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("SERVER ERROR:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

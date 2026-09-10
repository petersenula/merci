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

    const body = await req.json();
    const { scheme_id } = body;

    if (!scheme_id) {
      return NextResponse.json({ error: "Missing scheme_id" }, { status: 400 });
    }

    const updates: {
      name?: string;
      active_from?: string | null;
      active_to?: string | null;
    } = {};

    if ("name" in body) {
      updates.name = body.name;
    }

    if ("active_from" in body) {
      updates.active_from = body.active_from || null;
    }

    if ("active_to" in body) {
      updates.active_to = body.active_to || null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data, error } = await supabaseAdmin
      .from("allocation_schemes")
      .update(updates)
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

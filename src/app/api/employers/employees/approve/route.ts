import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/authenticateApiRequest";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  const user = await authenticateApiRequest(req);

  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const { link_id } = await req.json();

  if (!link_id) {
    return NextResponse.json(
      { error: "Missing link_id" },
      { status: 400 }
    );
  }

  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from("employers_earners")
    .update({
      pending: false,
      is_active: true
    })
    .eq("id", link_id)
    .eq("employer_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("EMPLOYEE APPROVE ERROR:", error);
    return NextResponse.json({ error }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(
      { error: "Employee relation not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}

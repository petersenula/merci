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

  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from("employers_earners")
    .select("*, profiles_earner(*)")
    .eq("employer_id", user.id)
    .eq("is_active", true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ employees: data });
}

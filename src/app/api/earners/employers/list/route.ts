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
    .select(`
      id,
      pending,
      is_active,
      role,
      employer_id,
      share_page_access,
      employers:employer_id (
        user_id,
        name,
        slug,
        invite_code
      )
    `)
    .eq("earner_id", user.id);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({
    pending: data.filter((x) => x.pending),
    active: data.filter((x) => !x.pending && x.is_active),
  });
}

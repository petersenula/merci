import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();

  const supabase = createRouteHandlerClient({
    cookies: () => cookieStore as any,
  });
  const supabaseAdmin = getSupabaseAdmin();

  const { earner_id } = await req.json();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log("API LIST USER:", user?.id);

  const { data, error } = await supabaseAdmin
    .from("employers_earners")
    .select(`
      id,
      pending,
      is_active,
      role,
      earner_id,
      employer_id,
      share_page_access,
      employers:employer_id (
        user_id,
        name,
        slug,
        invite_code
      )
    `)
    .eq("earner_id", earner_id);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({
    pending: data.filter((x) => x.pending),
    active: data.filter((x) => !x.pending && x.is_active),
  });
}

import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/authenticateApiRequest";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateApiRequest(req);

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: employer, error } = await supabaseAdmin
      .from("employers")
      .select("user_id, stripe_account_id, stripe_status, stripe_charges_enabled, payment_account_mode")
      .eq("user_id", user.id)
      .single();

    if (error || !employer) {
      return NextResponse.json({ error: "Employer not found" }, { status: 404 });
    }

    return NextResponse.json({ employer });
  } catch (e: any) {
    console.error("employers/profile error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

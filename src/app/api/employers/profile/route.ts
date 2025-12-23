import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { employer_id } = await req.json();

    if (!employer_id) {
      return NextResponse.json({ error: "Missing employer_id" }, { status: 400 });
    }

    // employer_id у тебя = user_id работодателя
    const { data: employer, error } = await supabaseAdmin
      .from("employers")
      .select("user_id, stripe_account_id, stripe_status, stripe_charges_enabled")
      .eq("user_id", employer_id)
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

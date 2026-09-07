// src/app/api/employers/schemes/set-payment-owner/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { scheme_id, owner_type, owner_id } = await req.json();

    if (!scheme_id) {
      return NextResponse.json(
        { error: "Missing scheme_id" },
        { status: 400 }
      );
    }

    const clearingOwner = owner_type == null && owner_id == null;
    const settingOwner =
      (owner_type === "earner" || owner_type === "employer") &&
      typeof owner_id === "string" &&
      owner_id.length > 0;

    if (!clearingOwner && !settingOwner) {
      return NextResponse.json(
        { error: "Invalid payment page owner" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("allocation_schemes")
      .update({
        payment_page_owner_type: owner_type,
        payment_page_owner_id: owner_id,
      })
      .eq("id", scheme_id);

    if (error) {
      console.error("SET PAYMENT OWNER ERROR:", error);
      return NextResponse.json(
        { error: "Failed to set payment page owner" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("SET PAYMENT OWNER SERVER ERROR:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

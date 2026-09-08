// src/app/api/employers/schemes/set-display-options/route.ts
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

    const {
      scheme_id,
      show_goal,
      show_goal_amount,
      show_progress,
    } = await req.json();

    if (!scheme_id) {
      return NextResponse.json({ error: "Missing scheme_id" }, { status: 400 });
    }

    // -------------------------------------------------------
    // FIX #1: If goal is turned OFF → amount and progress OFF
    // -------------------------------------------------------
    let final_show_goal_amount = show_goal_amount;
    let final_show_progress = show_progress;

    if (show_goal === false) {
      final_show_goal_amount = false;
      final_show_progress = false;
    }

    // -------------------------------------------------------
    // FIX #2: If amount is OFF → progress must also be OFF
    // (works even without disabling the whole goal)
    // -------------------------------------------------------
    if (final_show_goal_amount === false) {
      final_show_progress = false;
    }

    // -------------------------------------------------------
    // Prepare updateData
    // -------------------------------------------------------
    const updateData: any = {};

    if (typeof show_goal === "boolean") updateData.show_goal = show_goal;

    if (typeof final_show_goal_amount === "boolean")
      updateData.show_goal_amount = final_show_goal_amount;

    if (typeof final_show_progress === "boolean")
      updateData.show_progress = final_show_progress;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Nothing to update" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // -------------------------------------------------------
    // Save to Supabase
    // -------------------------------------------------------
    const { data, error } = await supabaseAdmin
      .from("allocation_schemes")
      .update(updateData)
      .eq("id", scheme_id)
      .eq("employer_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("SET DISPLAY OPTIONS ERROR:", error);
      return NextResponse.json(
        { error: "Failed to update display options" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Scheme not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (e) {
    console.error("SET DISPLAY OPTIONS SERVER ERROR:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

type ChecklistRole = "employer" | "earner";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") ?? "";

    const supabaseAuth = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const role = req.nextUrl.searchParams.get("role") as ChecklistRole | null;

    if (role !== "employer" && role !== "earner") {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    if (role === "employer") {
      const [employeesResult, schemesResult] = await Promise.all([
        supabaseAdmin
          .from("employers_earners")
          .select("id", { count: "exact", head: true })
          .eq("employer_id", user.id)
          .eq("is_active", true),
        supabaseAdmin
          .from("allocation_schemes")
          .select("id", { count: "exact", head: true })
          .eq("employer_id", user.id),
      ]);

      if (employeesResult.error || schemesResult.error) {
        console.error("Employer checklist load failed:", {
          employeesError: employeesResult.error,
          schemesError: schemesResult.error,
        });

        return NextResponse.json(
          { error: "Failed to load checklist" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        employeesDone: (employeesResult.count ?? 0) > 0,
        schemeDone: (schemesResult.count ?? 0) > 0,
      });
    }

    const { count, error } = await supabaseAdmin
      .from("employers_earners")
      .select("id", { count: "exact", head: true })
      .eq("earner_id", user.id)
      .eq("is_active", true);

    if (error) {
      console.error("Earner checklist load failed:", error);

      return NextResponse.json(
        { error: "Failed to load checklist" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      employersDone: (count ?? 0) > 0,
    });
  } catch (error) {
    console.error("Onboarding checklist server error:", error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

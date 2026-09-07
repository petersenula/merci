import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { resolvePricingAccount } from "@/lib/pricing/resolvePricingAccount";

export async function GET(req: Request) {
  try {
    const supabaseAuth = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: req.headers.get("authorization") ?? "",
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

    const account = await resolvePricingAccount(user.id);

    if (!account) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: assignment, error } = await supabaseAdmin
      .from("pricing_assignments")
      .select("code_snapshot")
      .eq("account_type", account.accountType)
      .eq("account_id", account.accountId)
      .eq("is_current", true)
      .maybeSingle();

    if (error) {
      console.error("CURRENT PRICING LOAD ERROR:", error);

      return NextResponse.json(
        { error: "Failed to load pricing code" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      code: assignment?.code_snapshot ?? null,
    });
  } catch (error) {
    console.error("CURRENT PRICING SERVER ERROR:", error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

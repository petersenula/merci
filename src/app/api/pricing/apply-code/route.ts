import { NextRequest, NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { resolvePricingAccount } from "@/lib/pricing/resolvePricingAccount";

type ApplyPricingRpcRow = {
  result: "OK" | "INVALID" | "EXPIRED";
  applied_code: string | null;
};

export async function POST(req: NextRequest) {
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

    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { code: "PRICING_CODE_INVALID" },
        { status: 400 }
      );
    }

    const rawCode =
      typeof body === "object" &&
      body !== null &&
      "code" in body &&
      typeof (body as { code?: unknown }).code === "string"
        ? (body as { code: string }).code
        : "";

    const normalizedCode = rawCode.trim().toUpperCase();

    if (!normalizedCode || normalizedCode.length > 100) {
      return NextResponse.json(
        { code: "PRICING_CODE_INVALID" },
        { status: 400 }
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

    const { data, error } = await supabaseAdmin.rpc(
      "apply_pricing_code",
      {
        p_account_type: account.accountType,
        p_account_id: account.accountId,
        p_code: normalizedCode,
      }
    );

    if (error) {
      console.error("APPLY PRICING CODE RPC ERROR:", error);

      return NextResponse.json(
        { error: "Failed to apply pricing code" },
        { status: 500 }
      );
    }

    const row = Array.isArray(data)
      ? (data[0] as ApplyPricingRpcRow | undefined)
      : undefined;

    if (!row) {
      console.error("APPLY PRICING CODE EMPTY RPC RESULT");

      return NextResponse.json(
        { error: "Failed to apply pricing code" },
        { status: 500 }
      );
    }

    if (row.result === "EXPIRED") {
      return NextResponse.json(
        { code: "PRICING_CODE_EXPIRED" },
        { status: 400 }
      );
    }

    if (row.result !== "OK") {
      // Intentionally generic:
      // do not reveal whether the code exists or belongs to another audience.
      return NextResponse.json(
        { code: "PRICING_CODE_INVALID" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      code: row.applied_code,
    });
  } catch (error) {
    console.error("APPLY PRICING CODE SERVER ERROR:", error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

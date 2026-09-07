import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { resolvePricingAccount } from "@/lib/pricing/resolvePricingAccount";
import type { Database } from "@/types/supabase";

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

    const account = await resolvePricingAccount(user.id);

    if (!account) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { error } = await supabaseAdmin.rpc(
      "reset_pricing_code",
      {
        p_account_type: account.accountType,
        p_account_id: account.accountId,
      }
    );

    if (error) {
      console.error("RESET PRICING CODE RPC ERROR:", error);

      return NextResponse.json(
        { error: "Failed to reset pricing code" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("RESET PRICING CODE SERVER ERROR:", error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

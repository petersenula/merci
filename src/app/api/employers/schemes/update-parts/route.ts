import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/authenticateApiRequest";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type SchemePartInput = {
  part_index: number;
  label: string;
  percent: number;
  destination_kind: "earner" | "employer";
  destination_id: string;
};

type Warning = {
  destination_id: string;
  destination_kind: "earner" | "employer";
  name: string | null;
  reasons: string[];
};

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateApiRequest(req);

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const schemeId = body?.scheme_id;
    const parts = body?.parts as SchemePartInput[] | undefined;

    if (!schemeId) {
      return NextResponse.json(
        { error: "Missing scheme_id" },
        { status: 400 }
      );
    }

    if (!Array.isArray(parts) || parts.length === 0) {
      return NextResponse.json(
        { error: "Scheme must contain at least one part" },
        { status: 400 }
      );
    }

    const normalizedParts = parts.map((part, index) => ({
      part_index: index + 1,
      label: String(part.label ?? "").trim(),
      percent: Number(part.percent),
      destination_kind: part.destination_kind,
      destination_type: part.destination_kind,
      destination_id: part.destination_id,
    }));

    const invalidPart = normalizedParts.find(
      (part) =>
        !part.label ||
        !Number.isFinite(part.percent) ||
        part.percent <= 0 ||
        !part.destination_id ||
        (part.destination_kind !== "earner" &&
          part.destination_kind !== "employer")
    );

    if (invalidPart) {
      return NextResponse.json(
        { error: "Scheme contains invalid parts" },
        { status: 400 }
      );
    }

    const totalPercent = normalizedParts.reduce(
      (sum, part) => sum + part.percent,
      0
    );

    if (Math.abs(totalPercent - 100) > 0.000001) {
      return NextResponse.json(
        { error: "Scheme allocation must total 100%" },
        { status: 400 }
      );
    }

    const destinationKeys = normalizedParts.map(
      (part) => `${part.destination_kind}:${part.destination_id}`
    );

    if (new Set(destinationKeys).size !== destinationKeys.length) {
      return NextResponse.json(
        { error: "A recipient can only appear once in a scheme" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: scheme, error: schemeError } = await supabaseAdmin
      .from("allocation_schemes")
      .select("id, employer_id")
      .eq("id", schemeId)
      .maybeSingle();

    if (schemeError) {
      console.error("Scheme ownership load failed:", schemeError);
      return NextResponse.json(
        { error: "Failed to load scheme" },
        { status: 500 }
      );
    }

    if (!scheme || scheme.employer_id !== user.id) {
      return NextResponse.json(
        { error: "Scheme not found" },
        { status: 404 }
      );
    }

    const warnings: Warning[] = [];

    const employerParts = normalizedParts.filter(
      (part) => part.destination_kind === "employer"
    );

    for (const part of employerParts) {
      if (part.destination_id !== user.id) {
        return NextResponse.json(
          { error: "Invalid employer recipient" },
          { status: 400 }
        );
      }

      const { data: employer, error: employerError } = await supabaseAdmin
        .from("employers")
        .select(
          "user_id, display_name, name, stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled, payment_account_mode"
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (employerError || !employer) {
        return NextResponse.json(
          { error: "Employer recipient not found" },
          { status: 400 }
        );
      }

      if (
        employer.payment_account_mode !== "own_account" ||
        !employer.stripe_account_id
      ) {
        return NextResponse.json(
          { error: "Employer does not have a payout account" },
          { status: 400 }
        );
      }

      const reasons: string[] = [];

      if (!employer.stripe_account_id) reasons.push("no_stripe_account");
      if (employer.stripe_charges_enabled === false)
        reasons.push("charges_disabled");
      if (employer.stripe_payouts_enabled === false)
        reasons.push("payouts_disabled");

      if (reasons.length > 0) {
        warnings.push({
          destination_id: employer.user_id,
          destination_kind: "employer",
          name: employer.display_name ?? employer.name ?? null,
          reasons,
        });
      }
    }

    const earnerIds = normalizedParts
      .filter((part) => part.destination_kind === "earner")
      .map((part) => part.destination_id);

    if (earnerIds.length > 0) {
      const { data: relations, error: relationsError } = await supabaseAdmin
        .from("employers_earners")
        .select(`
          earner_id,
          is_active,
          profiles_earner (
            id,
            display_name,
            stripe_account_id,
            stripe_charges_enabled,
            stripe_payouts_enabled
          )
        `)
        .eq("employer_id", user.id)
        .in("earner_id", earnerIds);

      if (relationsError) {
        console.error("Scheme earner validation failed:", relationsError);
        return NextResponse.json(
          { error: "Failed to validate recipients" },
          { status: 500 }
        );
      }

      for (const earnerId of earnerIds) {
        const relation = (relations ?? []).find(
          (row) => row.earner_id === earnerId
        );

        if (!relation) {
          return NextResponse.json(
            { error: "Scheme contains an employee not linked to this employer" },
            { status: 400 }
          );
        }

        const profile = Array.isArray(relation.profiles_earner)
          ? relation.profiles_earner[0]
          : relation.profiles_earner;

        const reasons: string[] = [];

        if (relation.is_active === false) reasons.push("inactive");
        if (!profile?.stripe_account_id) reasons.push("no_stripe_account");
        if (profile?.stripe_charges_enabled === false)
          reasons.push("charges_disabled");
        if (profile?.stripe_payouts_enabled === false)
          reasons.push("payouts_disabled");

        if (reasons.length > 0) {
          warnings.push({
            destination_id: earnerId,
            destination_kind: "earner",
            name: profile?.display_name ?? null,
            reasons,
          });
        }
      }
    }

    const rpcResult = await (supabaseAdmin as any).rpc(
      "replace_allocation_scheme_parts",
      {
        p_scheme_id: schemeId,
        p_parts: normalizedParts,
      }
    );

    if (rpcResult.error) {
      console.error("Replace scheme parts RPC failed:", rpcResult.error);
      return NextResponse.json(
        { error: "Failed to update scheme participants" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      warnings,
    });
  } catch (error) {
    console.error("UPDATE SCHEME PARTS SERVER ERROR:", error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

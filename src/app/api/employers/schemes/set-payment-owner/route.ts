// src/app/api/employers/schemes/set-payment-owner/route.ts
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

    const supabaseAdmin = getSupabaseAdmin();

    const { data: scheme, error: schemeError } = await supabaseAdmin
      .from("allocation_schemes")
      .select("id")
      .eq("id", scheme_id)
      .eq("employer_id", user.id)
      .maybeSingle();

    if (schemeError) {
      console.error("PAYMENT OWNER SCHEME LOAD ERROR:", schemeError);
      return NextResponse.json(
        { error: "Failed to load scheme" },
        { status: 500 }
      );
    }

    if (!scheme) {
      return NextResponse.json(
        { error: "Scheme not found" },
        { status: 404 }
      );
    }

    if (settingOwner) {
      const { data: ownerParts, error: ownerPartsError } = await supabaseAdmin
        .from("allocation_scheme_parts")
        .select("destination_kind, destination_type")
        .eq("scheme_id", scheme_id)
        .eq("destination_id", owner_id);

      if (ownerPartsError) {
        console.error("PAYMENT OWNER PARTICIPANT LOAD ERROR:", ownerPartsError);
        return NextResponse.json(
          { error: "Failed to validate payment page owner" },
          { status: 500 }
        );
      }

      const ownerIsParticipant = (ownerParts ?? []).some(
        (part) =>
          part.destination_kind === owner_type ||
          part.destination_type === owner_type
      );

      if (!ownerIsParticipant) {
        return NextResponse.json(
          { error: "Invalid payment page owner" },
          { status: 400 }
        );
      }

      if (owner_type === "employer" && owner_id !== user.id) {
        return NextResponse.json(
          { error: "Invalid payment page owner" },
          { status: 400 }
        );
      }

      if (owner_type === "earner") {
        const { data: relation, error: relationError } = await supabaseAdmin
          .from("employers_earners")
          .select("id")
          .eq("employer_id", user.id)
          .eq("earner_id", owner_id)
          .eq("is_active", true)
          .eq("share_page_access", true)
          .maybeSingle();

        if (relationError) {
          console.error("PAYMENT OWNER RELATION LOAD ERROR:", relationError);
          return NextResponse.json(
            { error: "Failed to validate payment page owner" },
            { status: 500 }
          );
        }

        if (!relation) {
          return NextResponse.json(
            { error: "Invalid payment page owner" },
            { status: 400 }
          );
        }
      }
    }

    const { data, error } = await supabaseAdmin
      .from("allocation_schemes")
      .update({
        payment_page_owner_type: owner_type,
        payment_page_owner_id: owner_id,
      })
      .eq("id", scheme_id)
      .eq("employer_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("SET PAYMENT OWNER ERROR:", error);
      return NextResponse.json(
        { error: "Failed to set payment page owner" },
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
    console.error("SET PAYMENT OWNER SERVER ERROR:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// src/app/api/employers/schemes/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/lib/authenticateApiRequest';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

type SchemePartInput = {
  part_index?: number;
  label?: string;
  percent?: number;
  destination_kind?: "earner" | "employer";
  destination_id?: string | null;
};

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateApiRequest(req);

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const name =
      typeof body?.name === "string"
        ? body.name.trim()
        : "";
    const description =
      typeof body?.description === "string" && body.description.trim()
        ? body.description.trim()
        : null;
    const parts = body?.parts as SchemePartInput[] | undefined;

    if (!name || !Array.isArray(parts) || parts.length === 0) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    const normalizedParts = parts.map((part, index) => ({
      part_index: index + 1,
      label: String(part.label ?? "").trim(),
      percent: Number(part.percent),
      destination_kind: part.destination_kind,
      destination_type: part.destination_kind,
      destination_id: part.destination_id ?? null,
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

    const invalidEmployerPart = normalizedParts.find(
      (part) =>
        part.destination_kind === "employer" &&
        part.destination_id !== user.id
    );

    if (invalidEmployerPart) {
      return NextResponse.json(
        { error: "Invalid employer recipient" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const hasEmployerRecipient = normalizedParts.some(
      (part) => part.destination_kind === "employer"
    );

    if (hasEmployerRecipient) {
      const { data: employerRecipient, error: employerRecipientError } =
        await supabaseAdmin
          .from("employers")
          .select("user_id, stripe_account_id, payment_account_mode")
          .eq("user_id", user.id)
          .maybeSingle();

      if (employerRecipientError || !employerRecipient) {
        return NextResponse.json(
          { error: "Employer recipient not found" },
          { status: 400 }
        );
      }

      if (
        employerRecipient.payment_account_mode !== "own_account" ||
        !employerRecipient.stripe_account_id
      ) {
        return NextResponse.json(
          { error: "Employer does not have a payout account" },
          { status: 400 }
        );
      }
    }

    const earnerIds = normalizedParts
      .filter((part) => part.destination_kind === "earner")
      .map((part) => part.destination_id as string);

    if (earnerIds.length > 0) {
      const { data: relations, error: relationsError } = await supabaseAdmin
        .from("employers_earners")
        .select("earner_id")
        .eq("employer_id", user.id)
        .eq("is_active", true)
        .in("earner_id", earnerIds);

      if (relationsError) {
        console.error("SCHEME RECIPIENT VALIDATION ERROR:", relationsError);
        return NextResponse.json(
          { error: "Failed to validate scheme recipients" },
          { status: 500 }
        );
      }

      const validEarnerIds = new Set(
        (relations ?? []).map((relation) => relation.earner_id)
      );
      const missingEarner = earnerIds.find(
        (earnerId) => !validEarnerIds.has(earnerId)
      );

      if (missingEarner) {
        return NextResponse.json(
          { error: "Scheme contains an invalid employee" },
          { status: 400 }
        );
      }
    }

    // 1. создаём схему
    const { data: scheme, error: createError } = await supabaseAdmin
      .from('allocation_schemes')
      .insert({
        employer_id: user.id,
        name,
        description,
        is_default: false,
      })
      .select()
      .single();

    if (createError || !scheme) {
      console.error('SCHEME ERROR:', createError);
      return NextResponse.json(
        { error: 'Failed to create scheme' },
        { status: 500 }
      );
    }

    // 2. сохраняем все части одной транзакцией внутри PostgreSQL function
    const partsResult = await supabaseAdmin.rpc(
      "replace_allocation_scheme_parts",
      {
        p_scheme_id: scheme.id,
        p_parts: normalizedParts,
      }
    );

    if (partsResult.error) {
      console.error("SCHEME PARTS RPC ERROR:", partsResult.error);

      const { error: cleanupError } = await supabaseAdmin
        .from("allocation_schemes")
        .delete()
        .eq("id", scheme.id)
        .eq("employer_id", user.id);

      if (cleanupError) {
        console.error("EMPTY SCHEME CLEANUP ERROR:", cleanupError);
      }

      return NextResponse.json(
        { error: "Failed to save scheme parts" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, scheme_id: scheme.id });
  } catch (e) {
    console.error('SERVER ERROR:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

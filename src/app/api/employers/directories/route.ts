import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

async function getAuthenticatedUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";

  const supabaseAuth = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: { Authorization: authHeader },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  return user;
}

function normalizeSchemeIds(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  const ids = value.map((id) => String(id ?? "").trim());

  if (ids.some((id) => !id)) {
    return null;
  }

  if (new Set(ids).size !== ids.length) {
    return null;
  }

  return ids;
}

async function validateSchemeOwnership(
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  employerId: string,
  schemeIds: string[]
) {
  const { data, error } = await supabaseAdmin
    .from("allocation_schemes")
    .select("id")
    .eq("employer_id", employerId)
    .in("id", schemeIds);

  if (error) {
    console.error("Directory scheme ownership check failed:", error);
    return { ok: false as const, serverError: true };
  }

  const ownedIds = new Set((data ?? []).map((scheme) => scheme.id));

  if (
    ownedIds.size !== schemeIds.length ||
    schemeIds.some((id) => !ownedIds.has(id))
  ) {
    return { ok: false as const, serverError: false };
  }

  return { ok: true as const };
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: directories, error } = await (supabaseAdmin as any)
      .from("scheme_directories")
      .select(`
        id,
        employer_id,
        name,
        description,
        is_active,
        created_at,
        updated_at,
        items:scheme_directory_items (
          id,
          scheme_id,
          position,
          scheme:allocation_schemes (
            id,
            name,
            description,
            active_from,
            active_to
          )
        )
      `)
      .eq("employer_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Load directories failed:", error);
      return NextResponse.json(
        { error: "Failed to load QR lists" },
        { status: 500 }
      );
    }

    const normalizedDirectories = (directories ?? []).map((directory: any) => ({
      ...directory,
      items: [...(directory.items ?? [])].sort(
        (a: any, b: any) => a.position - b.position
      ),
    }));

    return NextResponse.json({
      directories: normalizedDirectories,
    });
  } catch (error) {
    console.error("DIRECTORIES GET ERROR:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const name = String(body?.name ?? "").trim();
    const description = String(body?.description ?? "").trim();
    const schemeIds = normalizeSchemeIds(body?.scheme_ids);

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (!schemeIds) {
      return NextResponse.json(
        { error: "Select at least one scheme and do not select duplicates" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const ownership = await validateSchemeOwnership(
      supabaseAdmin,
      user.id,
      schemeIds
    );

    if (!ownership.ok) {
      return NextResponse.json(
        {
          error: ownership.serverError
            ? "Failed to validate schemes"
            : "One or more schemes do not belong to this employer",
        },
        { status: ownership.serverError ? 500 : 400 }
      );
    }

    const { data: directory, error: createError } = await (supabaseAdmin as any)
      .from("scheme_directories")
      .insert({
        employer_id: user.id,
        name,
        description: description || null,
        is_active: true,
      })
      .select("id, employer_id, name, description, is_active, created_at, updated_at")
      .single();

    if (createError || !directory) {
      console.error("Create directory failed:", createError);
      return NextResponse.json(
        { error: "Failed to create QR list" },
        { status: 500 }
      );
    }

    const rpcResult = await (supabaseAdmin as any).rpc(
      "replace_scheme_directory_items",
      {
        p_directory_id: directory.id,
        p_scheme_ids: schemeIds,
      }
    );

    if (rpcResult.error) {
      console.error("Create directory items failed:", rpcResult.error);

      const { error: cleanupError } = await (supabaseAdmin as any)
        .from("scheme_directories")
        .delete()
        .eq("id", directory.id)
        .eq("employer_id", user.id);

      if (cleanupError) {
        console.error(
          "Failed to clean up incomplete directory:",
          cleanupError
        );
      }

      return NextResponse.json(
        { error: "Failed to save QR list schemes" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      directory_id: directory.id,
    });
  } catch (error) {
    console.error("DIRECTORIES POST ERROR:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const directoryId = String(body?.directory_id ?? "").trim();
    const name = String(body?.name ?? "").trim();
    const description = String(body?.description ?? "").trim();
    const isActive =
      typeof body?.is_active === "boolean" ? body.is_active : true;
    const schemeIds = normalizeSchemeIds(body?.scheme_ids);

    if (!directoryId) {
      return NextResponse.json(
        { error: "Missing directory_id" },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (!schemeIds) {
      return NextResponse.json(
        { error: "Select at least one scheme and do not select duplicates" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: directory, error: directoryError } = await (
      supabaseAdmin as any
    )
      .from("scheme_directories")
      .select("id, employer_id")
      .eq("id", directoryId)
      .maybeSingle();

    if (directoryError) {
      console.error("Directory ownership load failed:", directoryError);
      return NextResponse.json(
        { error: "Failed to load QR list" },
        { status: 500 }
      );
    }

    if (!directory || directory.employer_id !== user.id) {
      return NextResponse.json(
        { error: "QR list not found" },
        { status: 404 }
      );
    }

    const ownership = await validateSchemeOwnership(
      supabaseAdmin,
      user.id,
      schemeIds
    );

    if (!ownership.ok) {
      return NextResponse.json(
        {
          error: ownership.serverError
            ? "Failed to validate schemes"
            : "One or more schemes do not belong to this employer",
        },
        { status: ownership.serverError ? 500 : 400 }
      );
    }

    const rpcResult = await (supabaseAdmin as any).rpc(
      "replace_scheme_directory_items",
      {
        p_directory_id: directoryId,
        p_scheme_ids: schemeIds,
      }
    );

    if (rpcResult.error) {
      console.error("Replace directory items failed:", rpcResult.error);
      return NextResponse.json(
        { error: "Failed to update QR list schemes" },
        { status: 500 }
      );
    }

    const { error: updateError } = await (supabaseAdmin as any)
      .from("scheme_directories")
      .update({
        name,
        description: description || null,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", directoryId)
      .eq("employer_id", user.id);

    if (updateError) {
      console.error("Update directory failed:", updateError);
      return NextResponse.json(
        { error: "Failed to update QR list" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DIRECTORIES PUT ERROR:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const directoryId = String(body?.directory_id ?? "").trim();

    if (!directoryId) {
      return NextResponse.json(
        { error: "Missing directory_id" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: directory, error: directoryError } = await (
      supabaseAdmin as any
    )
      .from("scheme_directories")
      .select("id, employer_id")
      .eq("id", directoryId)
      .maybeSingle();

    if (directoryError) {
      console.error("Directory ownership load failed:", directoryError);
      return NextResponse.json(
        { error: "Failed to load QR list" },
        { status: 500 }
      );
    }

    if (!directory || directory.employer_id !== user.id) {
      return NextResponse.json(
        { error: "QR list not found" },
        { status: 404 }
      );
    }

    const { error: deleteError } = await (supabaseAdmin as any)
      .from("scheme_directories")
      .delete()
      .eq("id", directoryId)
      .eq("employer_id", user.id);

    if (deleteError) {
      console.error("Delete directory failed:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete QR list" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DIRECTORIES DELETE ERROR:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

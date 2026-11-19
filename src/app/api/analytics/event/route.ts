import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { authenticateApiRequest } from "@/lib/authenticateApiRequest";

export const runtime = "nodejs";

const allowedEvents: Record<string, readonly string[]> = {
  page_view: ["home", "signup"],
  section_view: [
    "hero",
    "how",
    "features",
    "flexibility",
    "value",
    "individuals",
    "teams",
    "faq",
  ],
  signup_click: [
    "hero",
    "how_it_works",
    "trust",
    "flexibility",
    "value",
    "individuals",
    "teams",
    "faq",
    "tip_jar",
    "header",
    "how_it_works_page",
  ],
  signup_role_selected: ["earner", "employer"],
  signup_form_started: ["earner", "employer"],
  signup_form_submitted: ["earner", "employer"],
  signup_result: [
    "earner_accepted",
    "earner_existing",
    "earner_rejected",
    "earner_technical_error",
    "employer_accepted",
    "employer_existing",
    "employer_rejected",
    "employer_technical_error",
  ],
  profile_photo_added: ["earner_profile", "employer_profile"],
  profile_goal_added: ["earner_profile", "employer_profile"],
  qr_downloaded: [
    "earner_png_512",
    "earner_png_1024",
    "earner_jpg_1024",
    "earner_svg",
    "employer_direct_png_512",
    "employer_direct_png_1024",
    "employer_direct_jpg_1024",
    "employer_direct_svg",
    "employer_scheme_png_512",
    "employer_scheme_png_1024",
    "employer_scheme_jpg_1024",
    "employer_scheme_svg",
    "employer_directory_png_512",
    "employer_directory_png_1024",
    "employer_directory_jpg_1024",
    "employer_directory_svg",
  ],
};

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");

  if (!origin || origin !== req.nextUrl.origin) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  const contentType = req.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().startsWith("application/json")) {
    return NextResponse.json(
      { error: "Unsupported content type" },
      { status: 415 }
    );
  }

  const contentLength = Number(req.headers.get("content-length") ?? "0");

  if (contentLength > 1024) {
    return NextResponse.json(
      { error: "Payload too large" },
      { status: 413 }
    );
  }

  let body: unknown;

  try {
    const reader = req.body?.getReader();

    if (!reader) {
      return NextResponse.json(
        { error: "Invalid JSON" },
        { status: 400 }
      );
    }

    const chunks: Uint8Array[] = [];
    let totalBytes = 0;

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      totalBytes += value.byteLength;

      if (totalBytes > 1024) {
        await reader.cancel().catch(() => {});

        return NextResponse.json(
          { error: "Payload too large" },
          { status: 413 }
        );
      }

      chunks.push(value);
    }

    const bytes = new Uint8Array(totalBytes);
    let offset = 0;

    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }

    body = JSON.parse(new TextDecoder("utf-8", {
      fatal: true,
    }).decode(bytes));
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400 }
    );
  }

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    return NextResponse.json(
      { error: "Invalid payload" },
      { status: 400 }
    );
  }

  const payload = body as Record<string, unknown>;
  const { event_name, placement } = payload;

  if (
    typeof event_name !== "string" ||
    typeof placement !== "string" ||
    !allowedEvents[event_name]?.includes(placement)
  ) {
    return NextResponse.json(
      { error: "Invalid analytics event" },
      { status: 400 }
    );
  }

  // Profile analytics requires an authenticated user.
  // Public landing and signup events remain anonymous.
  const protectedEvents = new Set([
    "profile_photo_added",
    "profile_goal_added",
    "qr_downloaded",
  ]);

  if (protectedEvents.has(event_name)) {
    try {
      const user = await authenticateApiRequest(req);

      if (!user) {
        return NextResponse.json(
          { error: "Not authenticated" },
          { status: 401 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Authentication unavailable" },
        { status: 503 }
      );
    }
  }

  try {
    const supabase = getSupabaseAdmin();

    // Global, database-backed rate limit.
    // Fail closed: never increment analytics if the check fails.
    const { data: allowed, error: limitError } = await supabase.rpc(
      "try_consume_analytics_rate_limit"
    );

    if (limitError) {
      console.warn(
        "[analytics] Rate limit check failed:",
        limitError.code
      );

      return NextResponse.json(
        { error: "Analytics unavailable" },
        { status: 503 }
      );
    }

    if (allowed !== true) {
      return NextResponse.json(
        { error: "Too many analytics events" },
        { status: 429 }
      );
    }

    const { error } = await supabase.rpc(
      "increment_analytics_count",
      {
        p_event_name: event_name,
        p_placement: placement,
      }
    );

    if (error) {
      console.error("[analytics] Counter update failed", error.code);

      return NextResponse.json(
        { error: "Analytics unavailable" },
        { status: 503 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Analytics unavailable" },
      { status: 503 }
    );
  }
}

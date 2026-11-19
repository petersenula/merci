import "server-only";

import { after } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export type RegistrationAnalyticsRole = "earner" | "employer";

/**
 * Best-effort registration analytics.
 *
 * Must never throw or interrupt registration.
 * The database RPC handles deduplication atomically.
 */
export async function recordRegistration(
  userId: string,
  role: RegistrationAnalyticsRole
): Promise<void> {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { error } = await supabaseAdmin.rpc(
      "record_registration_analytics",
      {
        p_user_id: userId,
        p_role: role,
      }
    );

    if (error) {
      console.warn(
        "[analytics] Registration event could not be recorded:",
        error.code
      );
    }
  } catch {
    // Analytics must never interrupt registration.
  }
}

/**
 * Schedule analytics without affecting registration.
 * Errors in scheduling and execution are both isolated.
 */
export function scheduleRegistrationAnalytics(
  userId: string,
  role: RegistrationAnalyticsRole
): void {
  try {
    after(() => recordRegistration(userId, role));
  } catch {
    // Scheduling failure must never interrupt registration.
  }
}

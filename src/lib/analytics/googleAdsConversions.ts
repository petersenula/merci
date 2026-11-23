"use client";

import { getAdConsent } from "@/lib/analytics/adConsent";

export type GoogleAdsRegistrationRole = "earner" | "employer";

export async function trackGoogleAdsRegistration(
  role: GoogleAdsRegistrationRole,
  isNewRegistration: boolean
): Promise<void> {
  try {
    if (!isNewRegistration || getAdConsent() !== "accepted") return;

    const eventName =
      role === "employer"
        ? "click4tip_employer_registered"
        : "click4tip_earner_registered";

    const w = window as Window & { dataLayer?: Record<string, unknown>[] };
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ event: eventName });
  } catch {
    // Advertising measurement must never interrupt registration.
  }
}

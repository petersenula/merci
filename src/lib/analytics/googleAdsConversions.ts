"use client";

import { getAdConsent } from "@/lib/analytics/adConsent";

export type GoogleAdsRegistrationRole = "earner" | "employer";

type GoogleAdsWindow = Window & {
  gtag?: (...args: unknown[]) => void;
};

const CONVERSION_LABELS: Record<GoogleAdsRegistrationRole, string | undefined> = {
  earner: process.env.NEXT_PUBLIC_GOOGLE_ADS_EARNER_CONVERSION_LABEL,
  employer: process.env.NEXT_PUBLIC_GOOGLE_ADS_EMPLOYER_CONVERSION_LABEL,
};

const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;

export async function trackGoogleAdsRegistration(
  role: GoogleAdsRegistrationRole,
  isNewRegistration: boolean
): Promise<void> {
  try {
    if (!isNewRegistration || getAdConsent() !== "accepted") return;

    const label = CONVERSION_LABELS[role];
    if (!ADS_ID || !label) return;

    const gtag = (window as GoogleAdsWindow).gtag;
    if (typeof gtag !== "function") return;

    await new Promise<void>((resolve) => {
      let finished = false;
      let timeoutId: ReturnType<typeof setTimeout>;

      const finish = () => {
        if (finished) return;
        finished = true;
        clearTimeout(timeoutId);
        resolve();
      };

      timeoutId = setTimeout(finish, 800);

      try {
        gtag("event", "conversion", {
          send_to: `${ADS_ID}/${label}`,
          event_callback: finish,
          event_timeout: 800,
        });
      } catch {
        finish();
      }
    });
  } catch {
    // Advertising measurement must never interrupt registration.
  }
}

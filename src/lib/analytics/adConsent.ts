export type AdConsentChoice = "accepted" | "rejected";

const STORAGE_KEY = "click4tip_ad_consent_v1";

export function getAdConsent(): AdConsentChoice | null {
  if (typeof window === "undefined") return null;

  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "accepted" || value === "rejected" ? value : null;
  } catch {
    return null;
  }
}

export function saveAdConsent(choice: AdConsentChoice): boolean {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.setItem(STORAGE_KEY, choice);
    window.dispatchEvent(new Event("click4tip-ad-consent-changed"));
    return true;
  } catch {
    return false;
  }
}

export const AD_CONSENT_CHANGED_EVENT = "click4tip-ad-consent-changed";

export const AD_CONSENT_OPEN_EVENT = "click4tip-ad-consent-open";

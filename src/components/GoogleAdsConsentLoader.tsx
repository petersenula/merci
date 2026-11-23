"use client";

import { useEffect } from "react";
import {
  AD_CONSENT_CHANGED_EVENT,
  getAdConsent,
} from "@/lib/analytics/adConsent";

const GTM_ID = "GTM-NDG9FDKN";

export default function GoogleAdsConsentLoader() {
  useEffect(() => {
    const updateConsent = () => {
      const accepted = getAdConsent() === "accepted";
      const existingScript = document.getElementById("click4tip-gtm");

      if (!accepted) {
        if (existingScript) window.location.reload();
        return;
      }

      if (existingScript) return;

      const w = window as Window & {
        dataLayer?: Record<string, unknown>[];
      };

      w.dataLayer = w.dataLayer || [];
      w.dataLayer.push({
        "gtm.start": Date.now(),
        event: "gtm.js",
      });

      const script = document.createElement("script");
      script.id = "click4tip-gtm";
      script.async = true;
      script.src =
        "https://www.googletagmanager.com/gtm.js?id=" +
        encodeURIComponent(GTM_ID);
      document.head.appendChild(script);
    };

    updateConsent();
    window.addEventListener(AD_CONSENT_CHANGED_EVENT, updateConsent);

    return () => {
      window.removeEventListener(AD_CONSENT_CHANGED_EVENT, updateConsent);
    };
  }, []);

  return null;
}

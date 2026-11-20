"use client";

import { useEffect } from "react";
import {
  AD_CONSENT_CHANGED_EVENT,
  getAdConsent,
} from "@/lib/analytics/adConsent";

const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;

type GoogleWindow = Window & {
  dataLayer?: unknown[][];
  gtag?: (...args: unknown[]) => void;
};

export default function GoogleAdsConsentLoader() {
  useEffect(() => {
    if (!ADS_ID || !/^AW-\d+$/.test(ADS_ID)) return;

    const w = window as GoogleWindow;

    const updateConsent = () => {
      const accepted = getAdConsent() === "accepted";

      if (!accepted && w.gtag) {
        w.gtag("consent", "update", {
          ad_storage: "denied",
          ad_user_data: "denied",
          ad_personalization: "denied",
          analytics_storage: "denied",
        });
        window.location.reload();
        return;
      }

      if (!w.gtag && !accepted) return;

      if (!w.gtag) {
        w.dataLayer = w.dataLayer || [];
        w.gtag = (...args: unknown[]) => {
          w.dataLayer?.push(args);
        };

        w.gtag("consent", "default", {
          ad_storage: "denied",
          ad_user_data: "denied",
          ad_personalization: "denied",
          analytics_storage: "denied",
        });

        w.gtag("consent", "update", {
          ad_storage: "granted",
          ad_user_data: "granted",
          ad_personalization: "denied",
          analytics_storage: "denied",
        });

        w.gtag("js", new Date());
        w.gtag("config", ADS_ID);

        const script = document.createElement("script");
        script.async = true;
        script.src =
          "https://www.googletagmanager.com/gtag/js?id=" +
          encodeURIComponent(ADS_ID);
        document.head.appendChild(script);
      }

      w.gtag?.("consent", "update", {
        ad_storage: accepted ? "granted" : "denied",
        ad_user_data: accepted ? "granted" : "denied",
        ad_personalization: "denied",
        analytics_storage: "denied",
      });
    };

    updateConsent();
    window.addEventListener(AD_CONSENT_CHANGED_EVENT, updateConsent);

    return () => {
      window.removeEventListener(AD_CONSENT_CHANGED_EVENT, updateConsent);
    };
  }, []);

  return null;
}

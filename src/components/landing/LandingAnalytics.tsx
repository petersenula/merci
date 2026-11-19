"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/trackEvent";

const trackedSections = [
  "hero",
  "how",
  "features",
  "flexibility",
  "value",
  "individuals",
  "teams",
  "faq",
] as const;

export default function LandingAnalytics() {
  useEffect(() => {
    trackEvent("page_view", "home");

    try {
      const seen = new Set<string>();
      const timers = new Map<string, ReturnType<typeof setTimeout>>();

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const section = entry.target.getAttribute("data-analytics-section");
            if (!section || seen.has(section)) continue;

            const threshold =
              entry.target.getBoundingClientRect().height >
              window.innerHeight
                ? 0.25
                : 0.5;

            if (entry.intersectionRatio >= threshold) {
              if (!timers.has(section)) {
                const timer = setTimeout(() => {
                  seen.add(section);
                  timers.delete(section);
                  observer.unobserve(entry.target);
                  trackEvent("section_view", section);
                }, 1000);

                timers.set(section, timer);
              }
            } else {
              const timer = timers.get(section);
              if (timer) {
                clearTimeout(timer);
                timers.delete(section);
              }
            }
          }
        },
        {
          threshold: [0, 0.25, 0.5, 0.75, 1],
        }
      );

      for (const section of trackedSections) {
        const element = document.querySelector(
          `[data-analytics-section="${section}"]`
        );

        if (element) observer.observe(element);
      }

      return () => {
        observer.disconnect();

        for (const timer of timers.values()) {
          clearTimeout(timer);
        }

        timers.clear();
      };
    } catch {
      // Analytics failures must never affect the landing page.
    }
  }, []);

  return null;
}

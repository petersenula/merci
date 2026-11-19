"use client";

import { authenticatedFetch } from "@/lib/authenticatedFetch";

export type AnalyticsEventName =
  | "page_view"
  | "section_view"
  | "signup_click"
  | "signup_role_selected"
  | "signup_form_started"
  | "signup_form_submitted"
  | "signup_result"
  | "profile_photo_added"
  | "profile_goal_added"
  | "qr_downloaded";

export function trackEvent(
  eventName: AnalyticsEventName,
  placement: string
): void {
  if (typeof window === "undefined") return;

  try {
    const protectedEvents: readonly AnalyticsEventName[] = [
      "profile_photo_added",
      "profile_goal_added",
      "qr_downloaded",
    ];

    const send = protectedEvents.includes(eventName)
      ? authenticatedFetch
      : fetch;

    void send("/api/analytics/event", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event_name: eventName,
        placement,
      }),
      keepalive: true,
      credentials: "same-origin",
    }).catch(() => {
      // Analytics must never interrupt user actions.
    });
  } catch {
    // Analytics must never interrupt user actions.
  }
}

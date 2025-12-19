"use client";

import { useEffect } from "react";

export default function PushManager() {
  useEffect(() => {
    async function init() {
      if (!("serviceWorker" in navigator)) return;
      if (!("PushManager" in window)) return;

      const reg = await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.log("Push permission denied");
        return;
      }

      // Заменим позже реальным публичным ключом
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
      const converted = urlBase64ToUint8Array(vapidPublicKey);

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: converted,
      });

      // отправляем в Supabase API
      await fetch("/api/save-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });

      console.log("Push subscribed:", subscription);
    }

    init().catch(console.error);
  }, []);

  return null;
}

// helper для VAPID ключей
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const raw = atob(base64);
  const output = new Uint8Array(raw.length);

  for (let i = 0; i < raw.length; i++) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

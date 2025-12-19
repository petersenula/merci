self.addEventListener("install", (event) => {
  console.log("[SW] Installed");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[SW] Activated");
  return self.clients.claim();
});

// 🔥 Получение push уведомления
self.addEventListener("push", (event) => {
  console.log("[SW] Push received", event.data?.text());

  const payload = event.data ? event.data.json() : {};

  const title = payload.title || "New Tip!";
  const options = {
    body: payload.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: payload,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 🔥 Когда человек кликает по уведомлению
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // Если окно уже открыто — фокусируем
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      // Иначе — открываем новое
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// public/sw.js — Standard Web Push service worker (no external dependencies)

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

// Handle incoming push notification
self.addEventListener("push", function (event) {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch (_) {
    // Fallback for plain-text payloads (e.g. DevTools test push)
    data = { title: "Largada", body: event.data.text() };
  }

  const options = {
    body: data.body || "Nova notificação",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    vibrate: [200, 100, 200],
    data: { url: data.url || "/corridas" },
    tag: data.tag || "largada-" + Date.now(),
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Largada", options)
  );
});

// Handle notification click
self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const url = event.notification.data?.url || "/corridas";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (clientList) {
        const targetPath = new URL(url, self.location.origin).pathname;

        for (const client of clientList) {
          const clientPath = new URL(client.url).pathname;
          if (clientPath === targetPath && "focus" in client) {
            return client.focus();
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

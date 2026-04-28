const STATIC_CACHE = "largada-static-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(["/manifest.json"])
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => clients.claim())
  );
});

// Cache-first for Next.js static chunks (content-addressed by hash, always safe)
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Only cache /_next/static/ assets — these are immutable (hash in filename)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) => cached || fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
      )
    );
  }
  // All other requests fall through to network — no caching
});

// Handle incoming push notification
self.addEventListener("push", function (event) {
  console.log("[SW] push event received");

  let data;
  if (event.data) {
    try {
      data = event.data.json();
    } catch (_) {
      // Fallback for plain-text payloads (e.g. DevTools test push)
      data = { title: "Largada", body: event.data.text() };
    }
  } else {
    data = { title: "Largada", body: "Nova notificação" };
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

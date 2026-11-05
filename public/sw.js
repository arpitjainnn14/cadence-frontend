// Service worker for Cadence. Its only job is Web Push:
// the backend sends a push message, we show it as a notification,
// and tapping it opens (or focuses) the app.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

// The backend sends a flat JSON payload: {"title": "...", "body": "...", "url": "/"}
// (reminders and the test push use the same shape).
self.addEventListener("push", (event) => {
  let p = {};
  try {
    p = event.data ? event.data.json() : {};
  } catch {
    p = { body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(p.title || "Cadence", {
      body: p.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: p.url || "/" },
    }),
  );
});

// Note: this worker deliberately caches nothing. Card images come from
// /api/payment-methods/{id}/image with an ETag, so a replaced image shows up
// straight away; a cache here would get in the way of that.

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of windows) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client) await client.navigate(url);
          return;
        }
      }
      await self.clients.openWindow(url);
    })(),
  );
});

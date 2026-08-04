/**
 * Web Push handlers for Wevie.
 *
 * This script is layered onto the Workbox-generated service worker via
 * `workbox.importScripts` in vite.config.js (so the offline/caching config
 * stays untouched). It handles two events:
 *   - `push`: renders the notification the WebPushChannel sent
 *     (payload shape: { title, body, url, tag, icon }).
 *   - `notificationclick`: focuses an existing app tab (navigating it to the
 *     payload's `url`) or opens a new one.
 */

self.addEventListener("push", (event) => {
    let data = {};
    try {
        data = event.data ? event.data.json() : {};
    } catch {
        data = { title: "Wevie", body: event.data ? event.data.text() : "" };
    }

    const title = data.title || "Wevie";
    const options = {
        body: data.body || "",
        icon: data.icon || "/icons/icon-192x192v2.png",
        badge: "/icons/icon-192x192v2.png",
        tag: data.tag || undefined,
        data: { url: data.url || "/" },
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const targetUrl =
        (event.notification.data && event.notification.data.url) || "/";

    event.waitUntil(
        self.clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((clientList) => {
                for (const client of clientList) {
                    if ("focus" in client) {
                        client.focus();
                        if ("navigate" in client) {
                            client.navigate(targetUrl).catch(() => {});
                        }
                        return undefined;
                    }
                }
                if (self.clients.openWindow) {
                    return self.clients.openWindow(targetUrl);
                }
                return undefined;
            })
    );
});

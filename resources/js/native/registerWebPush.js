/**
 * Web Push (VAPID) subscription for the Wevie PWA / browser.
 *
 * Complements the iOS-only `registerPush.js`: this path targets normal browsers
 * (desktop Chrome/Edge/Firefox, Android Chrome, and installed iOS 16.4+ PWAs)
 * and needs no native shell. Because it prompts for notification permission and
 * subscribes the browser, `enableWebPush()` must be called from a user gesture
 * (e.g. a button click), not on app mount.
 *
 * The subscription is stored server-side in the shared `push_tokens` table via
 * the existing `device-tokens.store` endpoint, with provider `webpush`: a
 * SHA-256 of the endpoint as the stable `token` (fits the 512-char column and
 * powers the idempotent upsert) and the full PushSubscription JSON in `meta`.
 */

/**
 * Whether this browser can do Web Push at all.
 */
export function isWebPushSupported() {
    return (
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window &&
        window.isSecureContext === true
    );
}

/**
 * Resolves a Ziggy route by name, falling back to a literal path when the global
 * `route()` helper isn't available. Mirrors the helper in `registerPush.js`.
 */
function routeOr(name, params, fallback) {
    if (typeof window !== "undefined" && typeof window.route === "function") {
        try {
            return window.route(name, params);
        } catch {
            // Route not registered in this build — fall through to the literal.
        }
    }
    return fallback;
}

/**
 * Converts a base64url VAPID public key into the Uint8Array that
 * `PushManager.subscribe` expects for `applicationServerKey`.
 */
function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = window.atob(base64);
    const output = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i += 1) {
        output[i] = raw.charCodeAt(i);
    }
    return output;
}

/**
 * SHA-256 hex digest of a string (used as the stable device-token id).
 */
async function sha256Hex(input) {
    const data = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

/**
 * POSTs the browser subscription to the backend using the app's configured
 * axios (same-origin, so the session cookie + XSRF header ride along).
 */
async function sendSubscription(subscription) {
    const axios = typeof window !== "undefined" ? window.axios : null;
    if (!axios) {
        throw new Error("window.axios unavailable — cannot register subscription.");
    }

    const json = subscription.toJSON();
    const token = await sha256Hex(json.endpoint);

    await axios.post(routeOr("device-tokens.store", undefined, "/device-tokens"), {
        platform: "web",
        provider: "webpush",
        token,
        meta: json,
    });
}

/**
 * Requests notification permission, subscribes this browser to push, and
 * registers the subscription with the backend. Call from a user gesture.
 *
 * @param {string} vapidPublicKey  The server's public VAPID key (Inertia prop
 *                                 `webPush.vapidPublicKey`).
 * @returns {Promise<PushSubscription>}
 */
export async function enableWebPush(vapidPublicKey) {
    if (!isWebPushSupported()) {
        throw new Error("Push notifications aren't supported in this browser.");
    }
    if (!vapidPublicKey) {
        throw new Error("Web push isn't configured on the server (missing VAPID key).");
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
        throw new Error("Notification permission was not granted.");
    }

    const registration = await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
    }

    await sendSubscription(subscription);
    return subscription;
}

import { Capacitor } from "@capacitor/core";
import { router } from "@inertiajs/react";

/**
 * Native push (APNs) registration for the Wevie Capacitor iOS shell.
 *
 * Wevie ships as a remote-URL Capacitor wrapper: the native WebView loads the
 * live React site (https://wevie.app) and Capacitor injects its native bridge
 * into that remotely-served page, so `@capacitor/push-notifications` works from
 * here. Everything below is gated behind `Capacitor.isNativePlatform()`, so on
 * the web/PWA build this module is an inert no-op — no permission prompt, no
 * plugin import, no network call.
 *
 * The plugin itself is loaded with a dynamic `import()` so its native shim never
 * lands in the web bundle; only `@capacitor/core` (a tiny platform detector) is
 * evaluated eagerly, and only to answer "are we native?".
 */

let started = false;

/**
 * Resolves a Ziggy route by name, falling back to a literal path when Ziggy's
 * global `route()` helper isn't available (it's injected by the `@routes` Blade
 * directive on the served pages, but we stay defensive).
 */
function routeOr(name, params, fallback) {
    if (typeof window !== "undefined" && typeof window.route === "function") {
        try {
            return window.route(name, params);
        } catch {
            // Route not registered in this build — fall through to the literal path.
        }
    }
    return fallback;
}

/**
 * POSTs the APNs device token to the backend using the app's configured axios
 * (set up in bootstrap.js with the `X-Requested-With` header). The request is
 * same-origin against the served site, so the session cookie and the
 * `X-XSRF-TOKEN` header ride along automatically.
 */
function sendDeviceToken(token) {
    const axios = typeof window !== "undefined" ? window.axios : null;
    if (!axios) {
        console.warn("[push] window.axios unavailable — cannot register device token");
        return;
    }

    axios
        .post(routeOr("device-tokens.store", undefined, "/device-tokens"), {
            platform: "ios",
            provider: "apns",
            token,
        })
        .catch((error) => {
            console.error("[push] failed to POST device token", error);
        });
}

/**
 * Handles a notification tap. Mirrors the Phase-1 `NotificationItem` behavior:
 * if the push payload carries a `task_id`, navigate to the tasks list with the
 * id as a query param so the page can opt in to auto-opening it later.
 */
function handleActionPerformed(action) {
    const data = action?.notification?.data || {};
    const taskId = data.task_id ?? null;

    if (taskId) {
        // TODO: teach Pages/Tasks/Index.jsx to read `?task=<id>` and open the
        // matching TaskDetail modal on mount (same follow-up as NotificationItem).
        router.visit(routeOr("tasks.index", { task: taskId }, "/tasks"));
    }
}

/**
 * Requests push permission and registers for APNs. Safe to call unconditionally
 * after app mount — it returns immediately on web and on non-iOS platforms.
 * Idempotent: only the first invocation does any work.
 */
export async function registerPush() {
    if (started) return;
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "ios") {
        return;
    }
    started = true;

    try {
        const { PushNotifications } = await import("@capacitor/push-notifications");

        let permission = await PushNotifications.checkPermissions();
        if (
            permission.receive === "prompt" ||
            permission.receive === "prompt-with-rationale"
        ) {
            permission = await PushNotifications.requestPermissions();
        }

        if (permission.receive !== "granted") {
            console.warn("[push] permission not granted:", permission.receive);
            return;
        }

        // The APNs device token arrives asynchronously on this event.
        await PushNotifications.addListener("registration", (token) => {
            sendDeviceToken(token.value);
        });

        await PushNotifications.addListener("registrationError", (error) => {
            console.error("[push] APNs registration error", error);
        });

        // Fires when the user taps a delivered notification.
        await PushNotifications.addListener(
            "pushNotificationActionPerformed",
            handleActionPerformed
        );

        // Kicks off APNs registration; resolves the `registration` listener above.
        await PushNotifications.register();
    } catch (error) {
        console.error("[push] failed to initialize push notifications", error);
    }
}

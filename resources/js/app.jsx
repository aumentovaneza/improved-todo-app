import "../css/app.css";
import "./bootstrap";
import "react-toastify/dist/ReactToastify.css";

import { createInertiaApp, router } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { ToastContainer, toast } from "react-toastify";
import { PomodoroProvider } from "./Components/Pomodoro";
import NavigationLoader from "./Components/NavigationLoader";
import { registerSW } from "virtual:pwa-register";
import { initStatusBar } from "./native/statusBar";

const appName = import.meta.env.VITE_APP_NAME || "Wevie";

// A deploy rotates the hashed asset names; an already-open session can then try to
// lazy-import a page chunk whose old hash is gone from both the server and the purged
// service-worker precache, 404-ing hard. Reload once to pick up the fresh manifest,
// guarding against a loop if the deploy is genuinely broken.
const PRELOAD_RELOAD_KEY = "vite-preload-reloaded";
window.addEventListener("vite:preloadError", () => {
    if (sessionStorage.getItem(PRELOAD_RELOAD_KEY)) return;
    sessionStorage.setItem(PRELOAD_RELOAD_KEY, "1");
    window.location.reload();
});
// Re-arm once a page chunk actually loads: a genuinely broken deploy never fires
// "success", so the flag stays set and we never hard-loop; a recovered one clears it.
router.on("success", () => sessionStorage.removeItem(PRELOAD_RELOAD_KEY));

/**
 * Bridges Inertia server responses to react-toastify.
 *
 * The existing `Components/Toast.jsx` already surfaces `flash.message`
 * (success toasts), so to avoid double-toasting we only bridge `flash.error`
 * and the first validation error here. Listens on the Inertia router event
 * bus (works outside the <App> context) so it never fires on initial load.
 */
function FlashToaster() {
    useEffect(() => {
        const stop = router.on("success", (event) => {
            const page = event.detail?.page;
            if (!page) return;

            const flash = page.props?.flash || {};
            const errors = page.props?.errors || {};

            if (flash.error) {
                toast.error(flash.error);
                return;
            }

            const firstError = Object.values(errors)[0];
            if (firstError) {
                toast.error(
                    Array.isArray(firstError) ? firstError[0] : firstError
                );
            }
        });

        return () => stop();
    }, []);

    return null;
}

// Native shell (iOS/Capacitor): overlay the status bar so the safe-area inset resolves.
initStatusBar();

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob("./Pages/**/*.jsx")
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <PomodoroProvider>
                <App {...props} />
                <NavigationLoader />
                <FlashToaster />
                <ToastContainer
                    position="bottom-right"
                    autoClose={4000}
                    newestOnTop
                    closeOnClick
                    pauseOnHover
                    draggable
                    aria-label="Notifications"
                />
            </PomodoroProvider>
        );
    },
    progress: {
        color: "#4ACF91",
        showSpinner: false,
    },
});

if (import.meta.env.PROD && "serviceWorker" in navigator) {
    registerSW({ immediate: true });
}

// Native push (APNs) registration for the Capacitor iOS shell. Lazy-imported so
// none of the push code lands in the web main bundle; `registerPush` itself
// no-ops on web/PWA (it's gated behind Capacitor.isNativePlatform()).
import("./native/registerPush").then(({ registerPush }) => registerPush());

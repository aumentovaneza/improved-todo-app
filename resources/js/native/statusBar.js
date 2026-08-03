import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";

/**
 * Configure the native iOS/Android status bar so it overlays the web view.
 *
 * The web layout already reserves the notch/status-bar space via
 * `env(safe-area-inset-top)` (see TodoLayout's header) — for that inset to be
 * non-zero the status bar must sit *on top of* the web content rather than
 * pushing it down. We also keep the status-bar text legible by matching its
 * style to the app's dark-mode class (`<html class="dark">`).
 *
 * No-ops on the web (non-native) build, so it is safe to call unconditionally.
 */
export function initStatusBar() {
    if (!Capacitor.isNativePlatform()) {
        return;
    }

    const applyStyle = () => {
        const isDark = document.documentElement.classList.contains("dark");
        // Style.Dark => dark icons/text for light backgrounds; Style.Light => light text for dark backgrounds.
        StatusBar.setStyle({ style: isDark ? Style.Light : Style.Dark }).catch(() => {});
    };

    // Overlay so the web content extends under the status bar and the safe-area inset resolves.
    StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
    applyStyle();

    // Follow the dark-mode toggle (TodoLayout flips the `dark` class on <html>).
    const observer = new MutationObserver(applyStyle);
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
    });
}

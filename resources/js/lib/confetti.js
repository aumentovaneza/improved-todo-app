import confetti from "canvas-confetti";

// Wevie brand palette used across all celebratory moments.
const BRAND_COLORS = ["#4ACF91", "#5FDDE0", "#7FE0B2", "#6FD9D3"];

/**
 * True when the user has asked the OS to minimize non-essential motion.
 * All celebratory animation is suppressed in that case.
 */
function prefersReducedMotion() {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * A modest confetti burst — used for small wins (e.g. first task created,
 * a checklist item completed).
 */
export function fireConfetti(options = {}) {
    if (prefersReducedMotion()) return;

    confetti({
        particleCount: 80,
        spread: 70,
        startVelocity: 35,
        origin: { y: 0.7 },
        colors: BRAND_COLORS,
        disableForReducedMotion: true,
        zIndex: 11000,
        ...options,
    });
}

/**
 * A bigger, fuller celebration — used for finishing the tour or completing
 * the whole Getting Started checklist. Fires a couple of angled bursts.
 */
export function celebrate() {
    if (prefersReducedMotion()) return;

    const base = {
        colors: BRAND_COLORS,
        disableForReducedMotion: true,
        zIndex: 11000,
        startVelocity: 45,
        ticks: 200,
    };

    confetti({ ...base, particleCount: 120, spread: 90, origin: { y: 0.6 } });
    confetti({ ...base, particleCount: 60, angle: 60, spread: 55, origin: { x: 0, y: 0.7 } });
    confetti({ ...base, particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.7 } });
}

export default celebrate;

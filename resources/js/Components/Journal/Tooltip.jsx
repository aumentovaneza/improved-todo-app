import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// Delay before showing so quick pointer sweeps across the toolbar stay quiet.
const SHOW_DELAY = 300;
// Gap between the trigger and the tooltip chip, plus the room the chip needs
// above the trigger before we flip it below.
const GAP = 8;
const FLIP_THRESHOLD = 44;

/**
 * Lightweight, dependency-free tooltip for the Journal toolbar.
 *
 * The editor wrapper uses `overflow-hidden`, so a plain absolutely-positioned
 * tooltip inside it would be clipped. This portals the chip to `document.body`
 * and positions it with `position: fixed` against the trigger's live
 * `getBoundingClientRect()` — measured on open — so it is never clipped.
 * It renders above the trigger, centered, and flips below when there is not
 * enough room at the top of the viewport.
 */
export default function Tooltip({ label, children, className = "" }) {
    const triggerRef = useRef(null);
    const timerRef = useRef(null);
    const [coords, setCoords] = useState(null);

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const hide = useCallback(() => {
        clearTimer();
        setCoords(null);
    }, [clearTimer]);

    const show = useCallback(() => {
        clearTimer();
        timerRef.current = setTimeout(() => {
            const el = triggerRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const flip = rect.top < FLIP_THRESHOLD;
            setCoords({
                left: rect.left + rect.width / 2,
                top: flip ? rect.bottom + GAP : rect.top - GAP,
                placement: flip ? "bottom" : "top",
            });
        }, SHOW_DELAY);
    }, [clearTimer]);

    // Clean up the pending timer on unmount.
    useEffect(() => clearTimer, [clearTimer]);

    // While visible, dismiss on Escape and on any scroll/resize (which would
    // otherwise leave the fixed chip stranded at a stale position).
    useEffect(() => {
        if (!coords) return undefined;
        const onKey = (event) => {
            if (event.key === "Escape") hide();
        };
        window.addEventListener("keydown", onKey);
        window.addEventListener("scroll", hide, true);
        window.addEventListener("resize", hide);
        return () => {
            window.removeEventListener("keydown", onKey);
            window.removeEventListener("scroll", hide, true);
            window.removeEventListener("resize", hide);
        };
    }, [coords, hide]);

    // `onFocus`/`onBlur` bubble from the inner button, so wrapping is enough for
    // keyboard users; `onMouseEnter`/`onMouseLeave` cover pointer users.
    return (
        // The wrapper is not itself interactive — it only observes hover/focus of
        // the real button inside to position a decorative tooltip.
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions
        <span
            ref={triggerRef}
            className={`inline-flex ${className}`}
            onMouseEnter={show}
            onMouseLeave={hide}
            onFocus={show}
            onBlur={hide}
        >
            {children}
            {coords &&
                createPortal(
                    <span
                        role="tooltip"
                        className="journal-tooltip pointer-events-none fixed z-50 whitespace-nowrap rounded-md bg-neutral-800 px-2 py-1 text-xs font-medium text-white shadow-soft dark:bg-neutral-700 dark:text-dark-primary"
                        style={{
                            top: coords.top,
                            left: coords.left,
                            "--tooltip-tx": "-50%",
                            "--tooltip-ty": coords.placement === "top" ? "-100%" : "0",
                            transform: `translate(-50%, ${
                                coords.placement === "top" ? "-100%" : "0"
                            })`,
                        }}
                    >
                        {label}
                    </span>,
                    document.body
                )}
        </span>
    );
}

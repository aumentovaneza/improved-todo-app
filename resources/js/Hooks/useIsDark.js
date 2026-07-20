import { useEffect, useState } from "react";

/**
 * Reactive dark-mode flag.
 *
 * TodoLayout toggles dark mode by adding/removing the `dark` class on
 * <html>. Charts previously read that class once at render, so they never
 * recolored when the user flipped the theme without a remount. This hook
 * observes the class and updates live.
 */
export default function useIsDark() {
    const [isDark, setIsDark] = useState(
        () => typeof document !== "undefined" && document.documentElement.classList.contains("dark")
    );

    useEffect(() => {
        if (typeof document === "undefined") return undefined;

        const target = document.documentElement;
        const update = () => setIsDark(target.classList.contains("dark"));

        update();

        const observer = new MutationObserver(update);
        observer.observe(target, {
            attributes: true,
            attributeFilter: ["class"],
        });

        return () => observer.disconnect();
    }, []);

    return isDark;
}

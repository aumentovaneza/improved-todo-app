import { router } from "@inertiajs/react";
import { useEffect, useState } from "react";

const SHOW_DELAY_MS = 250;

export default function NavigationLoader() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        let timer = null;

        const handleStart = () => {
            timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
        };

        const handleFinish = () => {
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
            setVisible(false);
        };

        const stopStart = router.on("start", handleStart);
        const stopFinish = router.on("finish", handleFinish);

        return () => {
            if (timer) clearTimeout(timer);
            stopStart();
            stopFinish();
        };
    }, []);

    if (!visible) return null;

    return (
        <div
            role="status"
            aria-live="polite"
            aria-busy="true"
            className="pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 backdrop-blur-[1px] transition-opacity"
        >
            <div className="flex items-center gap-3 rounded-full bg-white/95 px-5 py-3 shadow-lg dark:bg-slate-800/95">
                <span
                    className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary-400 border-t-transparent"
                    aria-hidden="true"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Loading…
                </span>
            </div>
        </div>
    );
}

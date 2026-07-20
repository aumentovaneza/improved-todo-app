import { router } from "@inertiajs/react";
import { Info, Trash2 } from "lucide-react";
import { useState } from "react";

/**
 * Shown on the dashboard while the user still has seeded sample tasks/categories.
 * Clearing them removes only `is_sample` content for the current user.
 */
export default function SampleDataBanner({ show }) {
    const [clearing, setClearing] = useState(false);

    if (!show) return null;

    const clear = () => {
        setClearing(true);
        router.delete(route("sample-data.destroy"), {
            preserveScroll: true,
            onFinish: () => setClearing(false),
        });
    };

    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-primary-400/30 bg-primary-400/10 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-[#2ED7A1]/25 dark:bg-[#2ED7A1]/10">
            <div className="flex items-start gap-3">
                <Info className="mt-0.5 h-5 w-5 flex-none text-primary-500 dark:text-[#2ED7A1]" />
                <p className="text-sm text-light-secondary dark:text-dark-secondary">
                    We added a few{" "}
                    <span className="font-semibold text-light-primary dark:text-dark-primary">
                        sample tasks and categories
                    </span>{" "}
                    so you can explore Wevie right away. Clear them whenever
                    you're ready to make it your own.
                </p>
            </div>
            <button
                type="button"
                onClick={clear}
                disabled={clearing}
                className="inline-flex flex-none items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-light-primary shadow-sm ring-1 ring-black/5 transition-colors hover:bg-light-hover disabled:opacity-60 dark:bg-dark-card dark:text-dark-primary dark:ring-white/10 dark:hover:bg-dark-hover"
            >
                <Trash2 className="h-4 w-4" />
                {clearing ? "Clearing…" : "Clear sample data"}
            </button>
        </div>
    );
}

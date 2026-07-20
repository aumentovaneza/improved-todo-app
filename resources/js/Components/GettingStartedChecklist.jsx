import { celebrate } from "@/lib/confetti";
import { Link, router, usePage } from "@inertiajs/react";
import { AnimatePresence, motion } from "framer-motion";
import {
    Check,
    CheckSquare,
    Palette,
    Route as RouteIcon,
    Sparkles,
    Wallet,
    X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Persistent onboarding checklist shown on the dashboard. Item completion is
 * derived from real user data (`gettingStarted` from DashboardController) plus
 * the `onboarding` tour progress. Dismissal + auto-complete persist the
 * `checklist` tutorial key via the shared tutorials.update endpoint.
 */
export default function GettingStartedChecklist({ gettingStarted = {}, onAddTask }) {
    const user = usePage().props?.auth?.user;
    const progress = user?.tutorial_progress ?? {};
    const checklistState = progress.checklist ?? {};
    const tourDone = !!progress.onboarding?.completed;

    const items = useMemo(
        () => [
            {
                key: "tour",
                label: "Take the welcome tour",
                icon: RouteIcon,
                done: tourDone,
                cta: "Start",
                onClick: () =>
                    router.post(
                        route("tutorials.reset", { key: "onboarding" })
                    ),
            },
            {
                key: "task",
                label: "Create your first task",
                icon: CheckSquare,
                done: !!gettingStarted.hasTask,
                cta: "Add",
                onClick: onAddTask,
            },
            {
                key: "category",
                label: "Add a category to organize tasks",
                icon: Palette,
                done: !!gettingStarted.hasCategory,
                cta: "Add",
                href: route("categories.index"),
            },
            {
                key: "wallet",
                label: "Explore WevieWallet",
                icon: Wallet,
                done: !!gettingStarted.hasAccount || !!gettingStarted.hasTransaction,
                cta: "Open",
                href: route("weviewallet.dashboard"),
            },
            {
                key: "transaction",
                label: "Log your first transaction",
                icon: Sparkles,
                done: !!gettingStarted.hasTransaction,
                cta: "Log",
                href: route("weviewallet.transactions.index"),
            },
        ],
        [gettingStarted, tourDone, onAddTask]
    );

    const doneCount = items.filter((i) => i.done).length;
    const total = items.length;
    const allDone = doneCount === total;
    const pct = Math.round((doneCount / total) * 100);

    const [dismissed, setDismissed] = useState(
        !!checklistState.completed || !!checklistState.skipped
    );

    const persist = (payload) => {
        window.axios
            .post(route("tutorials.update", { key: "checklist" }), payload)
            .catch(() => {});
    };

    // Only celebrate a genuine in-session completion. If everything was already
    // done on mount (e.g. an existing user with data), collapse the widget
    // silently instead of firing confetti out of nowhere.
    const initiallyAllDoneRef = useRef(allDone);
    const handledRef = useRef(false);
    useEffect(() => {
        if (allDone && !handledRef.current && !checklistState.completed) {
            handledRef.current = true;
            if (!initiallyAllDoneRef.current) celebrate();
            persist({ completed: true });
        }
    }, [allDone, checklistState.completed]);

    const handleDismiss = () => {
        persist({ skipped: true });
        setDismissed(true);
    };

    if (dismissed) return null;

    return (
        <div className="mb-6 overflow-hidden rounded-2xl border border-light-border/70 bg-white shadow-soft dark:border-white/5 dark:bg-dark-card">
            <div className="flex items-start justify-between gap-3 border-b border-light-border/60 p-5 dark:border-white/5">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-[#5FDDE0] text-white shadow-sm">
                        <Sparkles className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <div>
                        <h3 className="text-sm font-semibold text-light-primary dark:text-dark-primary">
                            {allDone ? "You're all set! 🎉" : "Getting Started"}
                        </h3>
                        <p className="text-xs text-light-muted dark:text-dark-muted">
                            {allDone
                                ? "You've explored the essentials. Nice work!"
                                : `${doneCount} of ${total} done — a few quick steps to get the most out of Wevie.`}
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleDismiss}
                    aria-label="Dismiss checklist"
                    className="rounded-full p-1.5 text-light-muted transition-colors hover:bg-light-hover hover:text-light-primary dark:text-dark-muted dark:hover:bg-dark-hover dark:hover:text-dark-primary"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Progress bar */}
            <div className="px-5 pt-4">
                <div className="flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-light-hover dark:bg-dark-hover">
                        <div
                            className="h-full rounded-full bg-primary-400 transition-all duration-500 dark:bg-[#2ED7A1]"
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                    <span className="flex-none text-xs font-semibold text-primary-500 dark:text-[#2ED7A1]">
                        {pct}%
                    </span>
                </div>
            </div>

            <ul className="divide-y divide-light-border/50 p-2 dark:divide-white/5">
                {items.map((item) => {
                    const Icon = item.icon;
                    return (
                        <li
                            key={item.key}
                            className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                        >
                            <span
                                className={`flex h-7 w-7 flex-none items-center justify-center rounded-full border transition-colors ${
                                    item.done
                                        ? "border-primary-400 bg-primary-400 text-white dark:border-[#2ED7A1] dark:bg-[#2ED7A1]"
                                        : "border-light-border text-light-muted dark:border-white/15 dark:text-dark-muted"
                                }`}
                            >
                                <AnimatePresence mode="wait">
                                    {item.done ? (
                                        <motion.span
                                            key="check"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{
                                                type: "spring",
                                                stiffness: 400,
                                                damping: 15,
                                            }}
                                        >
                                            <Check className="h-4 w-4" strokeWidth={3} />
                                        </motion.span>
                                    ) : (
                                        <Icon key="icon" className="h-4 w-4" />
                                    )}
                                </AnimatePresence>
                            </span>

                            <span
                                className={`flex-1 text-sm ${
                                    item.done
                                        ? "text-light-muted line-through dark:text-dark-muted"
                                        : "text-light-secondary dark:text-dark-secondary"
                                }`}
                            >
                                {item.label}
                            </span>

                            {!item.done &&
                                (item.href ? (
                                    <Link
                                        href={item.href}
                                        className="flex-none rounded-md bg-primary-400/10 px-3 py-1 text-xs font-semibold text-primary-500 transition-colors hover:bg-primary-400/20 dark:text-[#2ED7A1]"
                                    >
                                        {item.cta}
                                    </Link>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={item.onClick}
                                        className="flex-none rounded-md bg-primary-400/10 px-3 py-1 text-xs font-semibold text-primary-500 transition-colors hover:bg-primary-400/20 dark:text-[#2ED7A1]"
                                    >
                                        {item.cta}
                                    </button>
                                ))}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

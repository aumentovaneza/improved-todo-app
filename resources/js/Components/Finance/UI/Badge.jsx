const TONES = {
    success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    danger: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    info: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
    purple: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
    neutral: "bg-light-hover text-light-secondary dark:bg-dark-hover dark:text-dark-secondary",
};

/**
 * Small status/type pill. Replaces the duplicated `typeStyles` objects.
 * Use with the tones exported from Utils/finance (TRANSACTION_TONE).
 */
export default function Badge({ label, tone = "neutral", className = "" }) {
    const toneClass = TONES[tone] ?? TONES.neutral;
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${toneClass} ${className}`}
        >
            {label}
        </span>
    );
}

import { ChevronRight } from "lucide-react";

/**
 * KPI tile used across WevieWallet. Interactive tiles (onClick provided) get a
 * hover state + a chevron so users can tell they open a detail view — the old
 * SummaryCards buttons gave no such affordance.
 */
export default function StatCard({
    label,
    value,
    icon: Icon,
    iconClassName = "bg-wevie-teal/10 text-wevie-teal",
    accent = "text-light-primary dark:text-dark-primary",
    hint,
    onClick,
    loading = false,
}) {
    const isInteractive = typeof onClick === "function";
    const Wrapper = isInteractive ? "button" : "div";

    return (
        <Wrapper
            type={isInteractive ? "button" : undefined}
            onClick={onClick}
            className={`card w-full p-4 text-left sm:p-5 ${
                isInteractive
                    ? "card-hover cursor-pointer focus:outline-none focus:ring-2 focus:ring-wevie-teal/40"
                    : ""
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-light-muted dark:text-dark-muted">
                        {label}
                    </p>
                    {loading ? (
                        <div className="mt-2 h-7 w-24 animate-pulse rounded-md bg-light-hover dark:bg-dark-hover" />
                    ) : (
                        <p className={`mt-1 truncate text-2xl font-bold ${accent}`}>{value}</p>
                    )}
                    {hint && !loading && (
                        <p className="mt-1 truncate text-xs text-light-muted dark:text-dark-muted">
                            {hint}
                        </p>
                    )}
                </div>
                <div className="flex flex-shrink-0 items-center gap-1">
                    {Icon && (
                        <div className={`rounded-full p-2 ${iconClassName}`} aria-hidden="true">
                            <Icon className="h-5 w-5" />
                        </div>
                    )}
                    {isInteractive && (
                        <ChevronRight
                            className="h-4 w-4 text-light-muted dark:text-dark-muted"
                            aria-hidden="true"
                        />
                    )}
                </div>
            </div>
        </Wrapper>
    );
}

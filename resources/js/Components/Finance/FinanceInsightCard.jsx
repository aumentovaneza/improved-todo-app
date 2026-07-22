import { useState } from "react";
import { router } from "@inertiajs/react";
import { formatDistanceToNow, isValid, parseISO } from "date-fns";
import { Sparkles, RefreshCw, Lock, Wand2 } from "lucide-react";

function relativeTime(value) {
    if (!value) return null;
    const parsed = typeof value === "string" ? parseISO(value) : new Date(value);
    if (!isValid(parsed)) return null;
    return formatDistanceToNow(parsed, { addSuffix: true });
}

/**
 * AI spending-insight banner shown at the top of the finance dashboard.
 *
 * State precedence (highest first):
 *   1. locked      — `canUse === false` (plan entitlement) → upsell
 *   2. empty       — no insight generated yet → Generate prompt
 *   3. has-insight — render the content + provenance
 *
 * `canUse` is treated as `true` when undefined so the banner keeps working
 * before the backend entitlement prop lands.
 */
export default function FinanceInsightCard({ insight = null, canUse = true, range = null }) {
    const [loading, setLoading] = useState(false);

    const generate = () => {
        if (loading || canUse === false) return;
        router.post(
            route("finance.insights.store"),
            range ? { range } : {},
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setLoading(true),
                onFinish: () => setLoading(false),
            }
        );
    };

    const shellClass =
        "card relative overflow-hidden bg-gradient-to-br from-primary-50 via-light-card to-secondary-50 p-5 dark:from-primary-900/20 dark:via-dark-card dark:to-secondary-900/20 sm:p-6";

    // 1. Locked — plan entitlement (Pro feature).
    if (canUse === false) {
        return (
            <section className={shellClass} aria-label="Spending insights (Pro)">
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-wevie-teal to-wevie-mint text-white">
                            <Lock className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-semibold text-adaptive-primary sm:text-lg">
                                    AI Spending Insights
                                </h2>
                                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-wevie-teal to-wevie-mint px-2 py-0.5 text-xs font-semibold text-white">
                                    <Sparkles className="h-3 w-3" aria-hidden="true" />
                                    Pro
                                </span>
                            </div>
                            <p className="mt-1 max-w-lg text-sm text-adaptive-muted">
                                Get an AI coach that reads your spending, budgets, and savings goals
                                and tells you where to focus. Upgrade to Pro to unlock insights.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        disabled
                        aria-disabled="true"
                        className="inline-flex flex-shrink-0 cursor-not-allowed items-center gap-2 rounded-xl bg-gradient-to-r from-wevie-teal to-wevie-mint px-4 py-2 text-sm font-medium text-white opacity-90"
                        title="Upgrade to Pro to unlock spending insights"
                    >
                        <Sparkles className="h-4 w-4" aria-hidden="true" />
                        Upgrade to Pro
                    </button>
                </div>
            </section>
        );
    }

    // 2. Empty — entitled, but nothing generated yet for this period.
    if (!insight || !insight.content) {
        return (
            <section className={shellClass} aria-label="Spending insights">
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-wevie-teal to-wevie-mint text-white">
                            <Sparkles className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <div>
                            <h2 className="text-base font-semibold text-adaptive-primary sm:text-lg">
                                Your spending insight is ready to write
                            </h2>
                            <p className="mt-1 max-w-lg text-sm text-adaptive-muted">
                                Generate an AI recap of this period’s spending, budgets, and savings
                                progress — with tips on where to focus next.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={generate}
                        disabled={loading}
                        className="btn-primary flex-shrink-0 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {loading ? (
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                            <Wand2 className="mr-2 h-4 w-4" aria-hidden="true" />
                        )}
                        {loading ? "Generating…" : "Generate insight"}
                    </button>
                </div>
            </section>
        );
    }

    // 3. Has insight. One insight per period, so there is no refresh control —
    // switching the dashboard range surfaces (or generates) that period's own.
    const updated = relativeTime(insight.generated_at);

    return (
        <section className={shellClass} aria-label="Spending insights">
            <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-wevie-teal to-wevie-mint text-white">
                    <Sparkles className="h-5 w-5" aria-hidden="true" />
                </span>
                <h2 className="text-base font-semibold text-adaptive-primary sm:text-lg">
                    Your spending insight
                </h2>
            </div>

            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-adaptive-secondary">
                {insight.content}
            </p>

            {updated && (
                <div className="mt-4 text-xs text-adaptive-muted">Updated {updated}</div>
            )}
        </section>
    );
}

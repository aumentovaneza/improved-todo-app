import { useState } from "react";
import { Link, router } from "@inertiajs/react";
import { formatDistanceToNow, isValid, parseISO } from "date-fns";
import { Sparkles, RefreshCw, Lock, BellOff, Wand2 } from "lucide-react";

function relativeTime(value) {
    if (!value) return null;
    const parsed = typeof value === "string" ? parseISO(value) : new Date(value);
    if (!isValid(parsed)) return null;
    return formatDistanceToNow(parsed, { addSuffix: true });
}

/**
 * AI daily-summary banner shown at the top of the dashboard.
 *
 * State precedence (highest first):
 *   1. locked      — `canUseDailySummary === false` (plan entitlement) → upsell
 *   2. disabled    — `dailySummaryEnabled === false` (user's own toggle)
 *   3. empty       — no summary generated yet → Generate prompt
 *   4. has-summary — render the content + provenance
 *
 * `canUseDailySummary` is treated as `true` when undefined so the banner keeps
 * working before the backend entitlement prop lands.
 */
export default function DailySummaryCard({ summary = null, enabled = true, canUse = true }) {
    const [loading, setLoading] = useState(false);

    const generate = () => {
        if (loading || canUse === false) return;
        router.post(
            route("dashboard.summary.refresh"),
            {},
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
            <section className={shellClass} aria-label="Daily AI summary (Pro)">
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-wevie-teal to-wevie-mint text-white">
                            <Lock className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-semibold text-adaptive-primary sm:text-lg">
                                    Daily AI Summary
                                </h2>
                                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-wevie-teal to-wevie-mint px-2 py-0.5 text-xs font-semibold text-white">
                                    <Sparkles className="h-3 w-3" aria-hidden="true" />
                                    Pro
                                </span>
                            </div>
                            <p className="mt-1 max-w-lg text-sm text-adaptive-muted">
                                Start each day with an AI recap of what’s due, what’s overdue, and
                                where to focus. Upgrade to Pro to unlock daily summaries.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        disabled
                        aria-disabled="true"
                        className="inline-flex flex-shrink-0 cursor-not-allowed items-center gap-2 rounded-xl bg-gradient-to-r from-wevie-teal to-wevie-mint px-4 py-2 text-sm font-medium text-white opacity-90"
                        title="Upgrade to Pro to unlock daily summaries"
                    >
                        <Sparkles className="h-4 w-4" aria-hidden="true" />
                        Upgrade to Pro
                    </button>
                </div>
            </section>
        );
    }

    // 2. Disabled — user turned the feature off.
    if (enabled === false) {
        return (
            <section className={shellClass} aria-label="Daily AI summary (off)">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-light-hover text-adaptive-muted dark:bg-dark-hover">
                        <BellOff className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                        <h2 className="text-base font-semibold text-adaptive-primary sm:text-lg">
                            Daily summary is off
                        </h2>
                        <p className="mt-0.5 text-sm text-adaptive-muted">
                            Turn it back on in{" "}
                            <Link
                                href={route("profile.edit")}
                                className="font-medium text-wevie-teal underline-offset-2 hover:underline"
                            >
                                settings
                            </Link>{" "}
                            to get an AI recap each morning.
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    // 3. Empty — enabled + entitled, but nothing generated yet.
    if (!summary || !summary.content) {
        return (
            <section className={shellClass} aria-label="Daily AI summary">
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-wevie-teal to-wevie-mint text-white">
                            <Sparkles className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <div>
                            <h2 className="text-base font-semibold text-adaptive-primary sm:text-lg">
                                Your daily summary is ready to write
                            </h2>
                            <p className="mt-1 max-w-lg text-sm text-adaptive-muted">
                                Generate an AI recap of today’s tasks, deadlines, and priorities.
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
                        {loading ? "Generating…" : "Generate summary"}
                    </button>
                </div>
            </section>
        );
    }

    // 4. Has summary.
    const updated = relativeTime(summary.generated_at);
    const provenance = [summary.provider, summary.model].filter(Boolean).join(" · ");

    return (
        <section className={shellClass} aria-label="Daily AI summary">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-wevie-teal to-wevie-mint text-white">
                        <Sparkles className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h2 className="text-base font-semibold text-adaptive-primary sm:text-lg">
                        Your daily summary
                    </h2>
                </div>
                <button
                    type="button"
                    onClick={generate}
                    disabled={loading}
                    aria-label="Refresh daily summary"
                    className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-light-border/70 bg-light-card/70 px-3 py-1.5 text-sm font-medium text-adaptive-secondary transition-colors hover:bg-light-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-wevie-teal/40 disabled:cursor-not-allowed disabled:opacity-70 dark:border-dark-border/70 dark:bg-dark-card/70 dark:hover:bg-dark-hover"
                >
                    <RefreshCw
                        className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                        aria-hidden="true"
                    />
                    <span className="hidden sm:inline">{loading ? "Refreshing…" : "Refresh"}</span>
                </button>
            </div>

            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-adaptive-secondary">
                {summary.content}
            </p>

            {(updated || provenance) && (
                <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-adaptive-muted">
                    {updated && <span>Updated {updated}</span>}
                    {updated && provenance && <span aria-hidden="true">·</span>}
                    {provenance && <span className="uppercase tracking-wide">{provenance}</span>}
                </div>
            )}
        </section>
    );
}

import { Link } from "@inertiajs/react";
import {
    CheckCircle2,
    Flame,
    ListChecks,
    RotateCcw,
    Settings,
    ShoppingBag,
    Sparkles,
    Timer,
    Trophy,
} from "lucide-react";
import WidgetFrame from "@/Components/Dashboard/WidgetFrame";
import EmptyState from "@/Components/Finance/UI/EmptyState";

/**
 * Points overview widget — reads the `points` slice of `widgetData`:
 *   { balance, streak, earned_this_week, by_source: [{ source, source_label, total }] }
 * Every value guards against a missing payload so the widget renders sensibly
 * when the backend disables it. Designed for the `sm` (1-col) default while
 * still reading well at `md` (2-col).
 */

const SOURCE_ICONS = {
    task: CheckCircle2,
    subtask: ListChecks,
    daily_streak: Flame,
    pomodoro_session: Timer,
    store_purchase: ShoppingBag,
    purchase_refund: RotateCcw,
    admin_adjust: Settings,
};

function iconForSource(source) {
    return SOURCE_ICONS[source] ?? Trophy;
}

export default function PointsWidget({ data, dragHandleProps }) {
    const balance = data?.balance ?? 0;
    const streak = data?.streak ?? 0;
    const earnedThisWeek = data?.earned_this_week ?? 0;
    const bySource = Array.isArray(data?.by_source) ? data.by_source : [];

    // Only positive earn sources make sense in a proportional bar list.
    const earnRows = bySource.filter((row) => (row.total ?? 0) > 0);
    const maxTotal = earnRows.reduce((max, row) => Math.max(max, row.total ?? 0), 0);

    return (
        <WidgetFrame
            title="Points"
            icon={Sparkles}
            iconClassName="bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300"
            dragHandleProps={dragHandleProps}
            action={
                <Link
                    href={route("points.index")}
                    className="rounded-md px-2 py-1 text-xs font-medium text-primary-600 transition-colors hover:bg-light-hover hover:text-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 dark:text-primary-300 dark:hover:bg-dark-hover"
                >
                    View history
                </Link>
            }
        >
            <div className="space-y-4">
                {/* Headline: balance + streak + this week */}
                <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-xs font-medium text-light-muted dark:text-dark-muted">
                            Balance
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-3xl font-bold tabular-nums text-primary-600 dark:text-primary-300">
                            <Sparkles className="h-6 w-6" aria-hidden="true" />
                            {balance.toLocaleString()}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        {streak > 0 && (
                            <span
                                className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                                title={`${streak}-day streak`}
                            >
                                <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                                {streak}d streak
                            </span>
                        )}
                        <span className="text-xs text-light-muted dark:text-dark-muted">
                            <span className="font-semibold text-light-primary dark:text-dark-primary">
                                +{earnedThisWeek.toLocaleString()}
                            </span>{" "}
                            this week
                        </span>
                    </div>
                </div>

                {/* By-source breakdown */}
                {earnRows.length === 0 ? (
                    <EmptyState
                        icon={Trophy}
                        title="No earns this week"
                        description="Complete tasks or a focus session to start racking up points."
                        className="py-6"
                    />
                ) : (
                    <div>
                        <p className="mb-2 text-xs font-medium text-light-muted dark:text-dark-muted">
                            Where points came from
                        </p>
                        <ul className="space-y-2.5">
                            {earnRows.map((row) => {
                                const Icon = iconForSource(row.source);
                                const total = row.total ?? 0;
                                const pct =
                                    maxTotal > 0
                                        ? Math.max(6, Math.round((total / maxTotal) * 100))
                                        : 0;
                                return (
                                    <li key={row.source}>
                                        <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                                            <span className="flex min-w-0 items-center gap-1.5 text-light-secondary dark:text-dark-secondary">
                                                <Icon
                                                    className="h-3.5 w-3.5 flex-shrink-0 text-primary-500 dark:text-primary-400"
                                                    aria-hidden="true"
                                                />
                                                <span className="truncate">
                                                    {row.source_label}
                                                </span>
                                            </span>
                                            <span className="flex-shrink-0 font-semibold tabular-nums text-light-primary dark:text-dark-primary">
                                                {total.toLocaleString()}
                                            </span>
                                        </div>
                                        <div
                                            className="h-1.5 w-full overflow-hidden rounded-full bg-light-hover dark:bg-dark-hover"
                                            role="img"
                                            aria-label={`${row.source_label}: ${total} points`}
                                        >
                                            <div
                                                className="h-full rounded-full bg-primary-400 dark:bg-primary-500"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </div>
        </WidgetFrame>
    );
}

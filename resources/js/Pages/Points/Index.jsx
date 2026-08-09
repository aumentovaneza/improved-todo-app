import EmptyState from "@/Components/Finance/UI/EmptyState";
import StatCard from "@/Components/Finance/UI/StatCard";
import TodoLayout from "@/Layouts/TodoLayout";
import { Head, Link } from "@inertiajs/react";
import { formatDistanceToNow, parseISO } from "date-fns";
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

/**
 * Maps a ledger `source` to a lucide icon. Falls back to Trophy for any source
 * this client build doesn't recognise yet (backend can add new earn sources).
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

function relativeTime(iso) {
    if (!iso) return "";
    try {
        return formatDistanceToNow(parseISO(iso), { addSuffix: true });
    } catch {
        return "";
    }
}

function LedgerRow({ entry }) {
    const Icon = iconForSource(entry.source);
    const isEarn = entry.amount > 0;
    const sign = isEarn ? "+" : "-";
    const magnitude = Math.abs(entry.amount).toLocaleString();

    return (
        <li className="flex items-center gap-3 px-4 py-3 sm:px-5">
            <span
                className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
                    isEarn
                        ? "bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300"
                        : "bg-light-hover text-light-muted dark:bg-dark-hover dark:text-dark-muted"
                }`}
                aria-hidden="true"
            >
                <Icon className="h-4 w-4" />
            </span>

            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-light-primary dark:text-dark-primary">
                    {entry.source_label}
                </p>
                <p className="truncate text-xs text-light-muted dark:text-dark-muted">
                    {relativeTime(entry.created_at)}
                </p>
            </div>

            <div className="flex flex-col items-end gap-0.5 text-right">
                <span
                    className={`text-sm font-bold tabular-nums ${
                        isEarn
                            ? "text-primary-600 dark:text-primary-300"
                            : "text-error-600 dark:text-error-400"
                    }`}
                >
                    {sign}
                    {magnitude}
                </span>
                {typeof entry.balance_after === "number" && (
                    <span className="text-[11px] tabular-nums text-light-muted dark:text-dark-muted">
                        {entry.balance_after.toLocaleString()} pts
                    </span>
                )}
            </div>
        </li>
    );
}

export default function Index({ balance = 0, streak = 0, ledger }) {
    // Laravel length-aware paginator: { data, links, ... }.
    const entries = ledger?.data ?? [];
    const links = ledger?.links ?? [];

    return (
        <TodoLayout header="Points">
            <Head title="Points" />

            <div className="mx-auto max-w-3xl space-y-6">
                {/* Balance + streak header */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <StatCard
                        label="Your points"
                        value={balance.toLocaleString()}
                        icon={Sparkles}
                        iconClassName="bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300"
                        accent="text-primary-600 dark:text-primary-300"
                        hint="Earn more by completing tasks and focus sessions"
                    />
                    <StatCard
                        label="Day streak"
                        value={streak.toLocaleString()}
                        icon={Flame}
                        iconClassName="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300"
                        accent="text-amber-600 dark:text-amber-400"
                        hint={
                            streak > 0
                                ? "Keep it going — check in daily"
                                : "Complete a task today to start a streak"
                        }
                    />
                </div>

                {/* Activity list */}
                <section aria-label="Points activity">
                    <h2 className="mb-3 px-1 text-sm font-semibold text-light-secondary dark:text-dark-secondary">
                        Recent activity
                    </h2>

                    {entries.length === 0 ? (
                        <EmptyState
                            icon={Sparkles}
                            title="No activity yet"
                            description="Earn points by completing tasks, subtasks, and focus sessions — your history will show up here."
                        />
                    ) : (
                        <div className="card overflow-hidden p-0">
                            <ul className="divide-y divide-light-border dark:divide-dark-border">
                                {entries.map((entry) => (
                                    <LedgerRow key={entry.id} entry={entry} />
                                ))}
                            </ul>
                        </div>
                    )}
                </section>

                {/* Pagination */}
                {links.length > 3 && (
                    <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
                        {links.map((link, index) => (
                            <Link
                                key={index}
                                href={link.url || "#"}
                                preserveScroll
                                aria-current={link.active ? "page" : undefined}
                                aria-disabled={!link.url}
                                tabIndex={link.url ? undefined : -1}
                                className={`rounded-md px-3 py-2 text-xs font-medium transition-colors sm:text-sm ${
                                    link.active
                                        ? "bg-primary-400 text-white"
                                        : link.url
                                          ? "text-light-secondary hover:bg-light-hover dark:text-dark-secondary dark:hover:bg-dark-hover"
                                          : "cursor-not-allowed text-light-muted dark:text-dark-muted"
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </TodoLayout>
    );
}

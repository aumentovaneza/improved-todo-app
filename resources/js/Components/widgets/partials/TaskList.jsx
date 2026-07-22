import { Link } from "@inertiajs/react";
import { format, isValid, parseISO } from "date-fns";
import EmptyState from "@/Components/Finance/UI/EmptyState";

const PRIORITY_STYLES = {
    urgent: "bg-amber-100/70 text-amber-700 dark:bg-amber-900/20 dark:text-amber-200",
    high: "bg-orange-100/70 text-orange-700 dark:bg-orange-900/20 dark:text-orange-200",
    medium: "bg-sky-100/70 text-sky-700 dark:bg-sky-900/20 dark:text-sky-200",
    low: "bg-emerald-100/70 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200",
};

const PRIORITY_LABELS = {
    urgent: "Focus",
    high: "High",
    medium: "Medium",
    low: "Low",
};

function toDate(value) {
    if (!value) return null;
    const parsed = typeof value === "string" ? parseISO(value) : new Date(value);
    return isValid(parsed) ? parsed : null;
}

/**
 * Compact task row used by the Today / Overdue / Upcoming / In-progress
 * dashboard widgets. Shows a category dot, the title, a due date, and a
 * priority badge. Rows link through to the task list so the widget stays
 * read-only and lightweight.
 */
export default function TaskList({
    tasks,
    emptyIcon,
    emptyTitle,
    emptyDescription,
    dueLabel = "Due",
    accentDue = false,
}) {
    const items = tasks ?? [];

    if (items.length === 0) {
        return <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />;
    }

    return (
        <ul className="space-y-2">
            {items.map((task) => {
                const due = toDate(task.due_date);
                const priority = task.priority ?? "medium";
                const isDone = task.status === "completed";

                return (
                    <li key={task.id}>
                        <Link
                            href={route("tasks.index")}
                            className="flex items-center justify-between gap-3 rounded-xl bg-light-hover px-3 py-2 transition-colors hover:bg-light-border/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-wevie-teal/40 dark:bg-dark-hover dark:hover:bg-dark-border/40"
                        >
                            <div className="flex min-w-0 items-center gap-2">
                                <span
                                    className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                                    style={{
                                        backgroundColor: task.category?.color ?? "#8FA3A6",
                                    }}
                                    aria-hidden="true"
                                />
                                <div className="min-w-0">
                                    <p
                                        className={`truncate text-sm font-medium ${
                                            isDone
                                                ? "text-light-muted line-through dark:text-dark-muted"
                                                : "text-adaptive-primary"
                                        }`}
                                    >
                                        {task.title}
                                    </p>
                                    {due && (
                                        <p
                                            className={`truncate text-xs ${
                                                accentDue
                                                    ? "text-amber-700 dark:text-amber-200"
                                                    : "text-adaptive-muted"
                                            }`}
                                        >
                                            {dueLabel} {format(due, "MMM d")}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <span
                                className={`inline-flex flex-shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                    PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.medium
                                }`}
                            >
                                {PRIORITY_LABELS[priority] ?? priority}
                            </span>
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}

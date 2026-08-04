import Modal from "@/Components/Modal";
import { formatCurrency } from "@/Utils/currency";
import { CalendarPlus, ChevronRight, ListPlus, Sun } from "lucide-react";
import { metaForSource, SOURCE_META } from "./CalendarItemMeta";

const formatDayLabel = (date) =>
    new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
    });

const formatTime = (value) =>
    new Date(value).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });

const capitalize = (value) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value);

function TypeBadge({ sourceType }) {
    const meta = metaForSource(sourceType);

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${meta.badgeClass}`}
        >
            <meta.Icon className="h-3 w-3" />
            {meta.label}
        </span>
    );
}

/**
 * Day-detail panel opened by clicking empty space on a calendar day. It lists
 * that day's events, tasks, and finance summary (already loaded, no fetch) and
 * offers the "act on this day" affordances: new event, new task, view the day.
 */
export default function DayDetailModal({
    show,
    onClose,
    date,
    items = [],
    onNewEvent,
    onNewTask,
    onViewDay,
    onOpenEvent,
    onOpenTask,
    onOpenFinance,
    onOpenMeal,
}) {
    if (!date) return null;

    const events = items.filter((item) => item.sourceType === "event");
    const tasks = items.filter((item) => item.sourceType === "task");
    const finance = items.find((item) => item.sourceType === "finance");
    const meals = items.filter((item) => item.sourceType === "meal");
    const isEmpty = !events.length && !tasks.length && !finance && !meals.length;

    return (
        <Modal show={show} onClose={onClose} maxWidth="xl" alignTop>
            <div className="max-h-[80vh] overflow-y-auto p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 className="text-base font-semibold text-light-primary sm:text-lg dark:text-dark-primary">
                            {formatDayLabel(date)}
                        </h2>
                        <p className="mt-0.5 text-sm text-light-muted dark:text-dark-muted">
                            {events.length} {events.length === 1 ? "event" : "events"} ·{" "}
                            {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
                            {finance ? ` · ${finance.extendedProps?.count ?? 0} finance` : ""}
                            {meals.length ? " · " + meals.length + " meal planning" : ""}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => onViewDay?.(date)}
                        className="btn-secondary shrink-0 gap-1.5 px-3 py-1.5 text-sm"
                    >
                        <Sun className="h-4 w-4" />
                        View day
                    </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => onNewEvent?.(date)}
                        className="btn-primary flex-1 gap-1.5 px-3 py-1.5 text-sm sm:flex-none"
                    >
                        <CalendarPlus className="h-4 w-4" />
                        New event
                    </button>
                    <button
                        type="button"
                        onClick={() => onNewTask?.(date)}
                        className="btn-secondary flex-1 gap-1.5 px-3 py-1.5 text-sm sm:flex-none"
                    >
                        <ListPlus className="h-4 w-4" />
                        New task
                    </button>
                </div>

                {isEmpty ? (
                    <div className="mt-8 rounded-xl border border-dashed border-light-border py-10 text-center dark:border-dark-border">
                        <SOURCE_META.event.Icon className="mx-auto h-8 w-8 text-light-muted dark:text-dark-muted" />
                        <p className="mt-2 text-sm text-light-secondary dark:text-dark-secondary">
                            Nothing scheduled for this day.
                        </p>
                    </div>
                ) : (
                    <div className="mt-5 space-y-5">
                        {events.length > 0 && (
                            <section>
                                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-light-muted dark:text-dark-muted">
                                    Events
                                </h3>
                                <div className="space-y-2">
                                    {events.map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => onOpenEvent?.(item)}
                                            className="flex w-full items-center gap-3 rounded-xl border border-light-border/70 bg-light-card px-3 py-2.5 text-left hover:bg-light-hover dark:border-dark-border/70 dark:bg-dark-card dark:hover:bg-dark-hover"
                                        >
                                            <span
                                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                                style={{ backgroundColor: item.color }}
                                            />
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm font-medium text-light-primary dark:text-dark-primary">
                                                    {item.title}
                                                </span>
                                                <span className="text-xs text-light-muted dark:text-dark-muted">
                                                    {item.allDay
                                                        ? "All day"
                                                        : formatTime(item.start)}
                                                </span>
                                            </span>
                                            <ChevronRight className="h-4 w-4 shrink-0 text-light-muted dark:text-dark-muted" />
                                        </button>
                                    ))}
                                </div>
                            </section>
                        )}

                        {tasks.length > 0 && (
                            <section>
                                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-light-muted dark:text-dark-muted">
                                    Tasks
                                </h3>
                                <div className="space-y-2">
                                    {tasks.map((item) => {
                                        const task = item.extendedProps?.task;

                                        return (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() =>
                                                    onOpenTask?.(item.extendedProps?.task)
                                                }
                                                className="flex w-full items-center gap-3 rounded-xl border border-light-border/70 bg-light-card px-3 py-2.5 text-left hover:bg-light-hover dark:border-dark-border/70 dark:bg-dark-card dark:hover:bg-dark-hover"
                                            >
                                                <span
                                                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                                                    style={{ backgroundColor: item.color }}
                                                />
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-sm font-medium text-light-primary dark:text-dark-primary">
                                                        {item.title}
                                                    </span>
                                                    <span className="text-xs text-light-muted dark:text-dark-muted">
                                                        {capitalize(task?.priority) || "Task"}
                                                        {task?.category?.name
                                                            ? ` · ${task.category.name}`
                                                            : ""}
                                                    </span>
                                                </span>
                                                <ChevronRight className="h-4 w-4 shrink-0 text-light-muted dark:text-dark-muted" />
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {meals.length > 0 && (
                            <section>
                                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-light-muted dark:text-dark-muted">
                                    Meal planning
                                </h3>
                                <div className="space-y-2">
                                    {meals.map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => onOpenMeal?.(item)}
                                            className="flex w-full items-center gap-3 rounded-xl border border-light-border/70 bg-light-card px-3 py-2.5 text-left hover:bg-light-hover dark:border-dark-border/70 dark:bg-dark-card dark:hover:bg-dark-hover"
                                        >
                                            <TypeBadge sourceType="meal" />
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm font-medium text-light-primary dark:text-dark-primary">
                                                    {item.title}
                                                </span>
                                                <span className="text-xs text-light-muted dark:text-dark-muted">
                                                    {formatTime(item.start)} ·{" "}
                                                    {capitalize(item.extendedProps?.status)}
                                                </span>
                                            </span>
                                            <ChevronRight className="h-4 w-4 shrink-0 text-light-muted dark:text-dark-muted" />
                                        </button>
                                    ))}
                                </div>
                            </section>
                        )}

                        {finance && (
                            <section>
                                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-light-muted dark:text-dark-muted">
                                    Finance
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => onOpenFinance?.(date)}
                                    className="flex w-full items-center gap-3 rounded-xl border border-light-border/70 bg-light-card px-3 py-2.5 text-left hover:bg-light-hover dark:border-dark-border/70 dark:bg-dark-card dark:hover:bg-dark-hover"
                                >
                                    <TypeBadge sourceType="finance" />
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-medium text-light-primary dark:text-dark-primary">
                                            {finance.extendedProps?.count ?? 0} transactions
                                        </span>
                                        <span
                                            className={`text-xs font-medium ${
                                                (finance.extendedProps?.net ?? 0) >= 0
                                                    ? "text-success-600 dark:text-success-400"
                                                    : "text-error-600 dark:text-error-400"
                                            }`}
                                        >
                                            Net{" "}
                                            {formatCurrency(
                                                finance.extendedProps?.net,
                                                finance.extendedProps?.currency
                                            )}
                                        </span>
                                    </span>
                                    <span className="shrink-0 text-xs font-medium text-wevie-teal">
                                        View all
                                    </span>
                                </button>
                            </section>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
}

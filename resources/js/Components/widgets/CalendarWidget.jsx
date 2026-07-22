import { CalendarRange, CheckSquare, Banknote } from "lucide-react";
import { format, isValid, parseISO, isSameDay } from "date-fns";
import WidgetFrame from "@/Components/Dashboard/WidgetFrame";
import EmptyState from "@/Components/Finance/UI/EmptyState";

function toDate(value) {
    if (!value) return null;
    const parsed = typeof value === "string" ? parseISO(value) : new Date(value);
    return isValid(parsed) ? parsed : null;
}

const TYPE_BADGE = {
    task: "bg-wevie-teal/10 text-wevie-teal",
    transaction:
        "bg-secondary-100 text-secondary-600 dark:bg-secondary-900/30 dark:text-secondary-300",
};

const TYPE_ICON = {
    task: CheckSquare,
    transaction: Banknote,
};

/**
 * Next-7-days calendar. `calendar` is a flat array of
 * `{ date, title, type: 'task' | 'transaction' }` — we sort by date and group
 * events under their day heading.
 */
export default function CalendarWidget({ data, dragHandleProps }) {
    const events = (data ?? [])
        .map((event) => ({ ...event, _date: toDate(event.date) }))
        .filter((event) => event._date)
        .sort((a, b) => a._date - b._date);

    const groups = [];
    events.forEach((event) => {
        const last = groups[groups.length - 1];
        if (last && isSameDay(last.date, event._date)) {
            last.items.push(event);
        } else {
            groups.push({ date: event._date, items: [event] });
        }
    });

    return (
        <WidgetFrame
            title="Next 7 days"
            icon={CalendarRange}
            iconClassName="bg-indigo-100/60 text-indigo-500 dark:bg-indigo-900/30"
            dragHandleProps={dragHandleProps}
        >
            {groups.length === 0 ? (
                <EmptyState
                    icon={CalendarRange}
                    title="A quiet week"
                    description="No tasks or transactions scheduled in the next 7 days."
                />
            ) : (
                <div className="space-y-4">
                    {groups.map((group) => (
                        <div key={group.date.toISOString()}>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-adaptive-muted">
                                {format(group.date, "EEE, MMM d")}
                            </p>
                            <ul className="space-y-2">
                                {group.items.map((event, index) => {
                                    const Icon = TYPE_ICON[event.type] ?? CheckSquare;
                                    return (
                                        <li
                                            key={`${event.title}-${index}`}
                                            className="flex items-center justify-between gap-3 rounded-xl bg-light-hover px-3 py-2 dark:bg-dark-hover"
                                        >
                                            <div className="flex min-w-0 items-center gap-2">
                                                <Icon
                                                    className="h-4 w-4 flex-shrink-0 text-adaptive-muted"
                                                    aria-hidden="true"
                                                />
                                                <span className="truncate text-sm font-medium text-adaptive-primary">
                                                    {event.title}
                                                </span>
                                            </div>
                                            <span
                                                className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                                                    TYPE_BADGE[event.type] ?? TYPE_BADGE.task
                                                }`}
                                            >
                                                {event.type}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
        </WidgetFrame>
    );
}

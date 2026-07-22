import {
    ListTodo,
    CheckCircle,
    Clock,
    Loader,
    AlertTriangle,
    CalendarDays,
    TrendingUp,
} from "lucide-react";
import WidgetFrame from "@/Components/Dashboard/WidgetFrame";
import StatCard from "@/Components/Finance/UI/StatCard";

/**
 * Task overview widget — a grid of KPI tiles derived from the `task_stats`
 * slice of `widgetData`. Every value guards against a missing payload so the
 * widget renders zeros rather than crashing when disabled server-side.
 */
export default function TaskStatsWidget({ data, dragHandleProps }) {
    const stats = data ?? {};

    const tiles = [
        {
            label: "Total tasks",
            value: stats.total_tasks ?? 0,
            icon: ListTodo,
            iconClassName: "bg-wevie-teal/10 text-wevie-teal",
        },
        {
            label: "Completed",
            value: stats.completed_tasks ?? 0,
            icon: CheckCircle,
            iconClassName: "bg-emerald-100/60 text-emerald-500 dark:bg-emerald-900/30",
        },
        {
            label: "Open",
            value: stats.pending_tasks ?? 0,
            icon: Clock,
            iconClassName: "bg-sky-100/60 text-sky-500 dark:bg-sky-900/30",
        },
        {
            label: "In progress",
            value: stats.in_progress_tasks ?? 0,
            icon: Loader,
            iconClassName: "bg-indigo-100/60 text-indigo-500 dark:bg-indigo-900/30",
        },
        {
            label: "Overdue",
            value: stats.overdue_tasks ?? 0,
            icon: AlertTriangle,
            iconClassName: "bg-amber-100/60 text-amber-500 dark:bg-amber-900/30",
        },
        {
            label: "Due today",
            value: stats.due_today_tasks ?? 0,
            icon: CalendarDays,
            iconClassName: "bg-rose-100/60 text-rose-500 dark:bg-rose-900/30",
        },
        {
            label: "Completion",
            value: `${stats.completion_rate ?? 0}%`,
            icon: TrendingUp,
            iconClassName: "bg-wevie-mint/20 text-wevie-mint dark:bg-wevie-mint/10",
        },
    ];

    return (
        <WidgetFrame title="Task overview" icon={ListTodo} dragHandleProps={dragHandleProps}>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
                {tiles.map((tile) => (
                    <StatCard
                        key={tile.label}
                        label={tile.label}
                        value={tile.value}
                        icon={tile.icon}
                        iconClassName={tile.iconClassName}
                    />
                ))}
            </div>
        </WidgetFrame>
    );
}

import TaskStatsWidget from "@/Components/widgets/TaskStatsWidget";
import TodayTasksWidget from "@/Components/widgets/TodayTasksWidget";
import OverdueTasksWidget from "@/Components/widgets/OverdueTasksWidget";
import UpcomingTasksWidget from "@/Components/widgets/UpcomingTasksWidget";
import InProgressWidget from "@/Components/widgets/InProgressWidget";
import UpcomingPaymentsWidget from "@/Components/widgets/UpcomingPaymentsWidget";
import BudgetWidget from "@/Components/widgets/BudgetWidget";
import CalendarWidget from "@/Components/widgets/CalendarWidget";
import ProductivityWidget from "@/Components/widgets/ProductivityWidget";
import PomodoroWidget from "@/Components/widgets/PomodoroWidget";
import WeatherWidget from "@/Components/widgets/WeatherWidget";

/**
 * Client-side registry mapping a widget `key` (from the backend layout) to its
 * React component and display title. `selfContained` marks widgets that render
 * their own `.card` shell (Weather) instead of a shared WidgetFrame — the grid
 * uses this to overlay the drag handle rather than pass it through.
 */
export const WIDGET_REGISTRY = {
    task_stats: { Component: TaskStatsWidget, title: "Task overview" },
    today_tasks: { Component: TodayTasksWidget, title: "Today’s tasks" },
    overdue_tasks: { Component: OverdueTasksWidget, title: "Tasks to revisit" },
    upcoming_tasks: { Component: UpcomingTasksWidget, title: "Coming up" },
    in_progress: { Component: InProgressWidget, title: "In progress" },
    upcoming_payments: {
        Component: UpcomingPaymentsWidget,
        title: "Upcoming payments",
    },
    budgets: { Component: BudgetWidget, title: "Budgets" },
    calendar: { Component: CalendarWidget, title: "Next 7 days" },
    productivity: { Component: ProductivityWidget, title: "Productivity" },
    pomodoro: { Component: PomodoroWidget, title: "Pomodoro" },
    weather: { Component: WeatherWidget, title: "Weather", selfContained: true },
};

/**
 * Look up a registry entry by key. Returns `null` for unknown keys so the grid
 * can skip anything the backend sends that this client build doesn't know yet.
 */
export function getWidget(key) {
    return WIDGET_REGISTRY[key] ?? null;
}

/**
 * Size → column-span class. Full static strings (never concatenated) so
 * Tailwind's JIT keeps them; also mirrored in tailwind.config safelist.
 *   sm → 1 col, md → 2 cols, lg → full row (4 cols) on lg screens.
 */
export const SIZE_COLSPAN = {
    sm: "sm:col-span-2 lg:col-span-1",
    md: "sm:col-span-2 lg:col-span-2",
    lg: "sm:col-span-2 lg:col-span-4",
};

export function getColSpanClass(size) {
    return SIZE_COLSPAN[size] ?? SIZE_COLSPAN.md;
}

import TodoLayout from "@/Layouts/TodoLayout";
import { Head, Link } from "@inertiajs/react";
import {
    ArrowLeft,
    BookOpen,
    CalendarDays,
    NotebookPen,
    Package,
    ShoppingCart,
    SlidersHorizontal,
    Users,
    Utensils,
} from "lucide-react";

const tabs = [
    ["Planner", "meal-planning.planner", Utensils],
    ["Diary", "meal-planning.diary", NotebookPen],
    ["Recipes", "meal-planning.recipes", BookOpen],
    ["Pantry", "meal-planning.pantry", Package],
    ["Grocery", "meal-planning.grocery", ShoppingCart],
    ["Meal calendar", "meal-planning.calendar", CalendarDays],
    ["Profiles", "meal-planning.members", Users],
    ["Preferences", "meal-planning.preferences", SlidersHorizontal],
];

export default function MealPlanningLayout({ household, title, children }) {
    const subtitle = [household.country_code, household.currency, household.timezone]
        .filter(Boolean)
        .join(" · ");

    return (
        <TodoLayout
            header={
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                    <Link
                        href={route("meal-planning.index")}
                        aria-label="All households"
                        className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-light-border/70 bg-light-card text-light-secondary transition-colors hover:bg-light-hover dark:border-dark-border/70 dark:bg-dark-card dark:text-dark-secondary dark:hover:bg-dark-hover"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div className="min-w-0">
                        <h2 className="truncate text-base font-semibold text-light-primary dark:text-dark-primary sm:text-lg">
                            {household.name}
                        </h2>
                        {subtitle && (
                            <p className="truncate text-xs text-light-muted dark:text-dark-muted">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={`${title} · ${household.name}`} />
            <div className="space-y-4 sm:space-y-6">
                <nav
                    className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
                    aria-label="Meal planning sections"
                >
                    {tabs.map(([label, routeName, Icon]) => {
                        const active = route().current(routeName);
                        return (
                            <Link
                                key={routeName}
                                href={route(routeName, household.id)}
                                aria-current={active ? "page" : undefined}
                                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                                    active
                                        ? "bg-gradient-to-r from-wevie-teal to-wevie-mint text-white shadow-soft"
                                        : "border border-light-border/70 bg-light-card text-light-secondary hover:bg-light-hover dark:border-dark-border/70 dark:bg-dark-card dark:text-dark-secondary dark:hover:bg-dark-hover"
                                }`}
                            >
                                <Icon className="h-4 w-4" aria-hidden="true" />
                                {label}
                            </Link>
                        );
                    })}
                </nav>
                {children}
            </div>
        </TodoLayout>
    );
}

export function Panel({ title, action, children, className = "" }) {
    return (
        <section className={`card p-4 sm:p-5 ${className}`}>
            {(title || action) && (
                <div className="mb-3 flex items-center justify-between gap-3">
                    {title && (
                        <h2 className="text-lg font-semibold text-light-primary dark:text-dark-primary">
                            {title}
                        </h2>
                    )}
                    {action}
                </div>
            )}
            {children}
        </section>
    );
}

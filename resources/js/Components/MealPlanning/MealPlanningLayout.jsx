import TodoLayout from "@/Layouts/TodoLayout";
import { Head, Link } from "@inertiajs/react";

const tabs = [
    ["Planner", "meal-planning.planner"],
    ["Diary", "meal-planning.diary"],
    ["Recipes", "meal-planning.recipes"],
    ["Pantry", "meal-planning.pantry"],
    ["Grocery", "meal-planning.grocery"],
    ["Meal calendar", "meal-planning.calendar"],
    ["Profiles", "meal-planning.members"],
    ["Preferences", "meal-planning.preferences"],
];

export default function MealPlanningLayout({ household, title, children }) {
    return (
        <TodoLayout>
            <Head title={`${title} · ${household.name}`} />
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-5 flex flex-col gap-3">
                    <div>
                        <Link
                            href={route("meal-planning.index")}
                            className="text-sm text-primary-600 hover:underline"
                        >
                            Households
                        </Link>
                        <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                            {household.name}
                        </h1>
                        <p className="text-sm text-gray-500">
                            {household.country_code} · {household.currency} · {household.timezone}
                        </p>
                    </div>
                    <nav
                        className="flex gap-2 overflow-x-auto pb-1"
                        aria-label="Meal planning sections"
                    >
                        {tabs.map(([label, routeName]) => (
                            <Link
                                key={routeName}
                                href={route(routeName, household.id)}
                                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium ${route().current(routeName) ? "bg-primary-600 text-white" : "bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-200"}`}
                            >
                                {label}
                            </Link>
                        ))}
                    </nav>
                </div>
                {children}
            </div>
        </TodoLayout>
    );
}

export function Panel({ title, children, className = "" }) {
    return (
        <section
            className={`rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 ${className}`}
        >
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
            {children}
        </section>
    );
}

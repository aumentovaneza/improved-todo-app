import MealPlanningLayout, { Panel } from "@/Components/MealPlanning/MealPlanningLayout";

export default function Calendar({ household, events = [] }) {
    const grouped = events.reduce((days, event) => {
        const day = event.starts_at?.slice(0, 10) || "Unscheduled";
        (days[day] ||= []).push(event);
        return days;
    }, {});

    return (
        <MealPlanningLayout household={household} title="Meal calendar">
            <Panel title="Meal calendar">
                <p className="mb-4 text-sm text-gray-500">
                    Meal, preparation, grocery, batch-cooking, defrosting, and pantry-expiry events
                    stay linked to the plan.
                </p>
                <div className="space-y-5">
                    {Object.entries(grouped).map(([day, dayEvents]) => (
                        <div key={day}>
                            <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
                                {day}
                            </h3>
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                {dayEvents.map((event) => (
                                    <article
                                        key={event.id}
                                        className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {event.title}
                                            </span>
                                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs uppercase text-gray-600 dark:bg-gray-700 dark:text-gray-200">
                                                {event.type}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-sm text-gray-500">
                                            {new Date(event.starts_at).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}{" "}
                                            · {event.status}
                                        </p>
                                    </article>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                {!events.length && (
                    <p className="text-sm text-gray-500">
                        Generate a plan to create linked events.
                    </p>
                )}
            </Panel>
        </MealPlanningLayout>
    );
}

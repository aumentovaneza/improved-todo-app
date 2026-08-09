import MealPlanningLayout, { Panel } from "@/Components/MealPlanning/MealPlanningLayout";
import { CalendarDays } from "lucide-react";

const formatDay = (day) => {
    if (day === "Unscheduled") return day;
    const parsed = new Date(`${day}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return day;
    return parsed.toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
    });
};

export default function Calendar({ household, events = [] }) {
    const grouped = events.reduce((days, event) => {
        const day = event.starts_at?.slice(0, 10) || "Unscheduled";
        (days[day] ||= []).push(event);
        return days;
    }, {});

    return (
        <MealPlanningLayout household={household} title="Meal calendar">
            <Panel title="Meal calendar">
                <p className="mb-4 text-sm text-light-secondary dark:text-dark-secondary">
                    Meal, preparation, grocery, batch-cooking, defrosting, and pantry-expiry events
                    stay linked to the plan.
                </p>
                {events.length > 0 ? (
                    <div className="space-y-5">
                        {Object.entries(grouped).map(([day, dayEvents]) => (
                            <div key={day}>
                                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-light-muted dark:text-dark-muted">
                                    {formatDay(day)}
                                </h3>
                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                    {dayEvents.map((event) => (
                                        <article
                                            key={event.id}
                                            className="rounded-xl border border-light-border/70 p-3 dark:border-dark-border/70"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="min-w-0 truncate font-medium text-light-primary dark:text-dark-primary">
                                                    {event.title}
                                                </span>
                                                <span className="flex-shrink-0 rounded-full bg-wevie-teal/10 px-2 py-0.5 text-xs font-medium uppercase text-wevie-teal dark:bg-wevie-teal/20 dark:text-wevie-mint">
                                                    {event.type}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-sm text-light-secondary dark:text-dark-secondary">
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
                ) : (
                    <div className="py-8 text-center">
                        <CalendarDays className="mx-auto mb-3 h-10 w-10 text-light-muted dark:text-dark-muted" />
                        <p className="text-sm text-light-secondary dark:text-dark-secondary">
                            Generate a plan to create linked meal-calendar events.
                        </p>
                    </div>
                )}
            </Panel>
        </MealPlanningLayout>
    );
}

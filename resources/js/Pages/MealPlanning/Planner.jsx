import MealPlanningLayout, { Panel } from "@/Components/MealPlanning/MealPlanningLayout";
import InputLabel from "@/Components/InputLabel";
import { router } from "@inertiajs/react";
import { AlertTriangle, CalendarPlus, Loader2, Lock, LockOpen } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";

const inputClass = "input-primary block border px-3 py-2 text-sm focus:ring-1 focus:outline-none";

export default function Planner({ household, plan }) {
    const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
    const [days, setDays] = useState(7);
    const [busy, setBusy] = useState(false);
    const createAndGenerate = async () => {
        setBusy(true);
        try {
            const created = await window.axios.post(
                route("meal-planning.api.plans.store", household.id),
                {
                    start_date: startDate,
                    number_of_days: Number(days),
                    priority_profile: household.settings?.priority_profile || "balanced",
                    settings: { meal_slots: ["breakfast", "lunch", "dinner", "snack"] },
                }
            );
            await window.axios.post(
                route("meal-planning.api.plans.generate", [household.id, created.data.data.id]),
                { idempotency_key: crypto.randomUUID() }
            );
            toast.success("Meal plan generated.");
            router.reload();
        } catch {
            toast.error("We couldn’t generate that plan just now. Please try again.");
        } finally {
            setBusy(false);
        }
    };
    const updateItem = async (item, data) => {
        await window.axios.patch(
            route("meal-planning.api.plan-items.update", [household.id, plan.id, item.id]),
            data
        );
        router.reload({ only: ["plan"] });
    };
    const byDate = (plan?.items || []).reduce(
        (groups, item) => ({ ...groups, [item.date]: [...(groups[item.date] || []), item] }),
        {}
    );
    return (
        <MealPlanningLayout household={household} title="Planner">
            <Panel title="Generate a plan">
                <div className="flex flex-wrap items-end gap-3">
                    <div>
                        <InputLabel htmlFor="plan-start" value="Start date" />
                        <input
                            id="plan-start"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className={`mt-1 ${inputClass}`}
                        />
                    </div>
                    <div>
                        <InputLabel htmlFor="plan-days" value="Days" />
                        <input
                            id="plan-days"
                            type="number"
                            min="1"
                            max="31"
                            value={days}
                            onChange={(e) => setDays(e.target.value)}
                            className={`mt-1 w-24 ${inputClass}`}
                        />
                    </div>
                    <button
                        onClick={createAndGenerate}
                        disabled={busy}
                        className="btn-primary disabled:opacity-60"
                    >
                        {busy ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <CalendarPlus className="mr-2 h-4 w-4" />
                        )}
                        {busy ? "Generating…" : "Generate"}
                    </button>
                </div>
            </Panel>
            {plan ? (
                <>
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-semibold text-light-primary dark:text-dark-primary">
                                {plan.start_date} · {plan.number_of_days} days
                            </h2>
                            <p className="text-sm capitalize text-light-secondary dark:text-dark-secondary">
                                {plan.status.replace("_", " ")}
                            </p>
                        </div>
                    </div>
                    {plan.warnings?.length > 0 && (
                        <div className="flex gap-2 rounded-xl border border-warning-500/30 bg-warning-500/10 p-3 text-sm text-warning-700 dark:text-warning-300">
                            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                            <div>
                                {plan.warnings.map((warning) => (
                                    <p key={warning}>{warning}</p>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="grid gap-4 lg:grid-cols-2">
                        {Object.entries(byDate).map(([date, items]) => (
                            <Panel
                                key={date}
                                title={new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
                                    weekday: "long",
                                    month: "short",
                                    day: "numeric",
                                })}
                            >
                                <div className="space-y-3">
                                    {items.map((item) => (
                                        <article
                                            key={item.id}
                                            className="rounded-xl bg-light-hover p-3 dark:bg-dark-hover"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <span className="inline-block rounded-full bg-wevie-teal/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-wevie-teal dark:bg-wevie-teal/20 dark:text-wevie-mint">
                                                        {item.meal_slot}
                                                    </span>
                                                    <p className="mt-1 font-medium text-light-primary dark:text-dark-primary">
                                                        {item.recipe?.name || "Unfilled meal"}
                                                    </p>
                                                    <p className="text-xs text-light-muted dark:text-dark-muted">
                                                        {Math.round(item.nutrition?.calories || 0)}{" "}
                                                        kcal per serving · {item.status}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() =>
                                                        updateItem(item, {
                                                            is_locked: !item.is_locked,
                                                        })
                                                    }
                                                    className="inline-flex flex-shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-light-secondary transition-colors hover:bg-light-card dark:text-dark-secondary dark:hover:bg-dark-card"
                                                >
                                                    {item.is_locked ? (
                                                        <Lock className="h-3.5 w-3.5" />
                                                    ) : (
                                                        <LockOpen className="h-3.5 w-3.5" />
                                                    )}
                                                    {item.is_locked ? "Unlock" : "Lock"}
                                                </button>
                                            </div>
                                            {item.portions?.length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {item.portions.map((portion) => (
                                                        <span
                                                            key={portion.id}
                                                            className="rounded-full bg-light-card px-2 py-1 text-xs text-light-secondary dark:bg-dark-card dark:text-dark-secondary"
                                                        >
                                                            {portion.member?.name}:{" "}
                                                            {portion.serving_multiplier}×
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </article>
                                    ))}
                                </div>
                            </Panel>
                        ))}
                    </div>
                </>
            ) : (
                <div className="card p-8 text-center">
                    <div className="mb-4 text-light-muted dark:text-dark-muted">
                        <CalendarPlus className="mx-auto h-10 w-10 sm:h-12 sm:w-12" />
                    </div>
                    <h3 className="mb-1 text-base font-semibold text-light-primary dark:text-dark-primary sm:text-lg">
                        No meal plan yet
                    </h3>
                    <p className="text-sm text-light-secondary dark:text-dark-secondary">
                        Pick a start date and number of days above, then generate a plan tailored to
                        your household.
                    </p>
                </div>
            )}
        </MealPlanningLayout>
    );
}

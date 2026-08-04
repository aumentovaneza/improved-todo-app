import MealPlanningLayout, { Panel } from "@/Components/MealPlanning/MealPlanningLayout";
import { router } from "@inertiajs/react";
import { useState } from "react";

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
            router.reload();
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
                    <label className="text-sm text-gray-600 dark:text-gray-300">
                        Start date
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="mt-1 block rounded-lg border-gray-300 dark:bg-gray-900"
                        />
                    </label>
                    <label className="text-sm text-gray-600 dark:text-gray-300">
                        Days
                        <input
                            type="number"
                            min="1"
                            max="31"
                            value={days}
                            onChange={(e) => setDays(e.target.value)}
                            className="mt-1 block w-24 rounded-lg border-gray-300 dark:bg-gray-900"
                        />
                    </label>
                    <button
                        onClick={createAndGenerate}
                        disabled={busy}
                        className="rounded-lg bg-primary-600 px-4 py-2 text-white"
                    >
                        {busy ? "Generating…" : "Generate"}
                    </button>
                </div>
            </Panel>
            {plan && (
                <>
                    <div className="my-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                {plan.start_date} · {plan.number_of_days} days
                            </h2>
                            <p className="text-sm capitalize text-gray-500">
                                {plan.status.replace("_", " ")}
                            </p>
                        </div>
                    </div>
                    {plan.warnings?.length > 0 && (
                        <div className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                            {plan.warnings.map((warning) => (
                                <p key={warning}>{warning}</p>
                            ))}
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
                                {items.map((item) => (
                                    <article
                                        key={item.id}
                                        className="mb-3 rounded-lg bg-gray-50 p-3 last:mb-0 dark:bg-gray-900"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">
                                                    {item.meal_slot}
                                                </p>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {item.recipe?.name || "Unfilled meal"}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {Math.round(item.nutrition?.calories || 0)} kcal
                                                    per serving · {item.status}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    updateItem(item, { is_locked: !item.is_locked })
                                                }
                                                className="text-xs text-primary-600"
                                            >
                                                {item.is_locked ? "Unlock" : "Lock"}
                                            </button>
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {item.portions?.map((portion) => (
                                                <span
                                                    key={portion.id}
                                                    className="rounded-full bg-white px-2 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                                                >
                                                    {portion.member?.name}:{" "}
                                                    {portion.serving_multiplier}×
                                                </span>
                                            ))}
                                        </div>
                                    </article>
                                ))}
                            </Panel>
                        ))}
                    </div>
                </>
            )}
        </MealPlanningLayout>
    );
}

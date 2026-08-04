import MealPlanningLayout, { Panel } from "@/Components/MealPlanning/MealPlanningLayout";
import { router } from "@inertiajs/react";
import axios from "axios";
import { useState } from "react";

export default function Diary({ household, entries = [], date }) {
    const [form, setForm] = useState({
        household_member_id: household.members?.[0]?.id || "",
        consumed_at: `${date}T12:00`,
        meal_slot: "lunch",
        name: "",
        calories: "",
    });
    const [busy, setBusy] = useState(false);
    const submit = async (event) => {
        event.preventDefault();
        setBusy(true);
        await axios.post(route("meal-planning.api.diary.store", household.id), {
            household_member_id: form.household_member_id,
            consumed_at: form.consumed_at,
            meal_slot: form.meal_slot,
            status: "modified",
            items: [
                {
                    type: "manual",
                    name: form.name,
                    serving_multiplier: 1,
                    nutrition_snapshot: { calories: Number(form.calories || 0) },
                    nutrition_source: "manual",
                    nutrition_confidence: "low",
                    calculation_version: "manual-v1",
                },
            ],
        });
        setForm({ ...form, name: "", calories: "" });
        setBusy(false);
        router.reload({ only: ["entries"] });
    };
    return (
        <MealPlanningLayout household={household} title="Meal diary">
            <div className="grid gap-5 lg:grid-cols-[2fr,1fr]">
                <Panel title={`Diary · ${date}`}>
                    <div className="space-y-3">
                        {entries.map((entry) => (
                            <article
                                key={entry.id}
                                className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                            >
                                <div className="flex justify-between gap-3">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {entry.member?.name} ·{" "}
                                            <span className="capitalize">{entry.meal_slot}</span>
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {entry.items?.map((item) => item.name).join(", ") ||
                                                entry.status}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900 dark:text-white">
                                            {Math.round(entry.actual_nutrition?.calories || 0)} kcal
                                        </p>
                                        <p className="text-xs capitalize text-gray-500">
                                            {entry.status.replaceAll("_", " ")}
                                        </p>
                                    </div>
                                </div>
                            </article>
                        ))}
                        {!entries.length && (
                            <p className="text-sm text-gray-500">No meals logged for this day.</p>
                        )}
                    </div>
                </Panel>
                <Panel title="Add diary item">
                    <form onSubmit={submit} className="space-y-3">
                        <select
                            value={form.household_member_id}
                            onChange={(e) =>
                                setForm({ ...form, household_member_id: e.target.value })
                            }
                            className="w-full rounded-lg border-gray-300 dark:bg-gray-900"
                        >
                            {household.members?.map((member) => (
                                <option key={member.id} value={member.id}>
                                    {member.name}
                                </option>
                            ))}
                        </select>
                        <div className="grid grid-cols-2 gap-2">
                            <select
                                value={form.meal_slot}
                                onChange={(e) => setForm({ ...form, meal_slot: e.target.value })}
                                className="rounded-lg border-gray-300 dark:bg-gray-900"
                            >
                                <option>breakfast</option>
                                <option>lunch</option>
                                <option>dinner</option>
                                <option>snack</option>
                            </select>
                            <input
                                type="datetime-local"
                                value={form.consumed_at}
                                onChange={(e) => setForm({ ...form, consumed_at: e.target.value })}
                                className="rounded-lg border-gray-300 dark:bg-gray-900"
                            />
                        </div>
                        <input
                            required
                            placeholder="Food or drink"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full rounded-lg border-gray-300 dark:bg-gray-900"
                        />
                        <input
                            min="0"
                            step="0.1"
                            type="number"
                            placeholder="Calories (optional)"
                            value={form.calories}
                            onChange={(e) => setForm({ ...form, calories: e.target.value })}
                            className="w-full rounded-lg border-gray-300 dark:bg-gray-900"
                        />
                        <button
                            disabled={busy}
                            className="w-full rounded-lg bg-primary-600 px-4 py-2 font-medium text-white"
                        >
                            Log meal
                        </button>
                    </form>
                </Panel>
            </div>
        </MealPlanningLayout>
    );
}

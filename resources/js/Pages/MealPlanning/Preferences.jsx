import MealPlanningLayout, { Panel } from "@/Components/MealPlanning/MealPlanningLayout";
import { useState } from "react";

export default function Preferences({ household }) {
    const current = household.settings || {};
    const [saved, setSaved] = useState(false);
    const [form, setForm] = useState({
        priority_profile: current.priority_profile || "balanced",
        budget_total: current.budget_total || "",
        preferred_preparation_minutes: current.preferred_preparation_minutes || 60,
        allow_specialty_ingredients: current.allow_specialty_ingredients || false,
        enable_leftovers: current.enable_leftovers || false,
        equipment: (current.equipment || []).join(", "),
    });
    const save = async (event) => {
        event.preventDefault();
        await window.axios.patch(route("meal-planning.api.households.update", household.id), {
            settings: {
                ...current,
                ...form,
                budget_total: form.budget_total ? Number(form.budget_total) : null,
                preferred_preparation_minutes: Number(form.preferred_preparation_minutes),
                equipment: form.equipment
                    .split(",")
                    .map((v) => v.trim())
                    .filter(Boolean),
            },
        });
        setSaved(true);
    };
    return (
        <MealPlanningLayout household={household} title="Preferences">
            <Panel title="Planning defaults">
                <form onSubmit={save} className="grid max-w-2xl gap-4 sm:grid-cols-2">
                    <label className="text-sm text-gray-600 dark:text-gray-300">
                        Priority
                        <select
                            value={form.priority_profile}
                            onChange={(e) => setForm({ ...form, priority_profile: e.target.value })}
                            className="mt-1 block w-full rounded-lg border-gray-300 dark:bg-gray-900"
                        >
                            {[
                                "balanced",
                                "lowest_cost",
                                "fastest_preparation",
                                "highest_nutrition_fit",
                                "maximum_pantry_usage",
                                "local_ingredients",
                            ].map((v) => (
                                <option key={v} value={v}>
                                    {v.replaceAll("_", " ")}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="text-sm text-gray-600 dark:text-gray-300">
                        Weekly budget
                        <input
                            type="number"
                            min="0"
                            value={form.budget_total}
                            onChange={(e) => setForm({ ...form, budget_total: e.target.value })}
                            className="mt-1 block w-full rounded-lg border-gray-300 dark:bg-gray-900"
                        />
                    </label>
                    <label className="text-sm text-gray-600 dark:text-gray-300">
                        Preferred preparation minutes
                        <input
                            type="number"
                            min="1"
                            value={form.preferred_preparation_minutes}
                            onChange={(e) =>
                                setForm({ ...form, preferred_preparation_minutes: e.target.value })
                            }
                            className="mt-1 block w-full rounded-lg border-gray-300 dark:bg-gray-900"
                        />
                    </label>
                    <label className="text-sm text-gray-600 dark:text-gray-300">
                        Equipment
                        <input
                            value={form.equipment}
                            onChange={(e) => setForm({ ...form, equipment: e.target.value })}
                            placeholder="oven, blender"
                            className="mt-1 block w-full rounded-lg border-gray-300 dark:bg-gray-900"
                        />
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <input
                            type="checkbox"
                            checked={form.allow_specialty_ingredients}
                            onChange={(e) =>
                                setForm({ ...form, allow_specialty_ingredients: e.target.checked })
                            }
                        />
                        Allow specialty ingredients
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <input
                            type="checkbox"
                            checked={form.enable_leftovers}
                            onChange={(e) =>
                                setForm({ ...form, enable_leftovers: e.target.checked })
                            }
                        />
                        Plan explicit leftovers and reserve the full batch
                    </label>
                    <button className="rounded-lg bg-primary-600 px-4 py-2 text-white">
                        Save preferences
                    </button>
                    {saved && <p className="text-sm text-green-600">Saved.</p>}
                </form>
            </Panel>
        </MealPlanningLayout>
    );
}

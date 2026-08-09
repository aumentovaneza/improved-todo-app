import MealPlanningLayout, { Panel } from "@/Components/MealPlanning/MealPlanningLayout";
import InputLabel from "@/Components/InputLabel";
import { Loader2, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";

const inputClass =
    "input-primary mt-1 block w-full border px-3 py-2 text-sm focus:ring-1 focus:outline-none";
const checkboxClass =
    "h-4 w-4 rounded border-light-border/70 text-wevie-teal focus:ring-wevie-teal/30 dark:border-dark-border/70 dark:bg-dark-card";

export default function Preferences({ household }) {
    const current = household.settings || {};
    const [busy, setBusy] = useState(false);
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
        setBusy(true);
        try {
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
            toast.success("Preferences saved.");
        } catch {
            toast.error("We couldn’t save your preferences just now.");
        } finally {
            setBusy(false);
        }
    };
    return (
        <MealPlanningLayout household={household} title="Preferences">
            <Panel title="Planning defaults">
                <form onSubmit={save} className="grid max-w-2xl gap-4 sm:grid-cols-2">
                    <div>
                        <InputLabel htmlFor="pref-priority" value="Priority" />
                        <select
                            id="pref-priority"
                            value={form.priority_profile}
                            onChange={(e) => setForm({ ...form, priority_profile: e.target.value })}
                            className={`${inputClass} capitalize`}
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
                    </div>
                    <div>
                        <InputLabel htmlFor="pref-budget" value="Weekly budget" />
                        <input
                            id="pref-budget"
                            type="number"
                            min="0"
                            value={form.budget_total}
                            onChange={(e) => setForm({ ...form, budget_total: e.target.value })}
                            placeholder="0"
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <InputLabel htmlFor="pref-prep" value="Preferred preparation minutes" />
                        <input
                            id="pref-prep"
                            type="number"
                            min="1"
                            value={form.preferred_preparation_minutes}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    preferred_preparation_minutes: e.target.value,
                                })
                            }
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <InputLabel htmlFor="pref-equipment" value="Equipment" />
                        <input
                            id="pref-equipment"
                            value={form.equipment}
                            onChange={(e) => setForm({ ...form, equipment: e.target.value })}
                            placeholder="oven, blender"
                            className={inputClass}
                        />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-light-secondary dark:text-dark-secondary">
                        <input
                            type="checkbox"
                            checked={form.allow_specialty_ingredients}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    allow_specialty_ingredients: e.target.checked,
                                })
                            }
                            className={checkboxClass}
                        />
                        Allow specialty ingredients
                    </label>
                    <label className="flex items-center gap-2 text-sm text-light-secondary dark:text-dark-secondary">
                        <input
                            type="checkbox"
                            checked={form.enable_leftovers}
                            onChange={(e) =>
                                setForm({ ...form, enable_leftovers: e.target.checked })
                            }
                            className={checkboxClass}
                        />
                        Plan explicit leftovers and reserve the full batch
                    </label>
                    <div className="sm:col-span-2">
                        <button
                            type="submit"
                            disabled={busy}
                            className="btn-primary disabled:opacity-60"
                        >
                            {busy ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            Save preferences
                        </button>
                    </div>
                </form>
            </Panel>
        </MealPlanningLayout>
    );
}

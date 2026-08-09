import MealPlanningLayout, { Panel } from "@/Components/MealPlanning/MealPlanningLayout";
import InputLabel from "@/Components/InputLabel";
import { router } from "@inertiajs/react";
import axios from "axios";
import { Loader2, NotebookPen, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";

const inputClass = "input-primary w-full border px-3 py-2 text-sm focus:ring-1 focus:outline-none";

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
        try {
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
            toast.success("Meal logged.");
            router.reload({ only: ["entries"] });
        } catch {
            toast.error("We couldn’t log that meal just now.");
        } finally {
            setBusy(false);
        }
    };
    return (
        <MealPlanningLayout household={household} title="Meal diary">
            <div className="grid gap-4 lg:grid-cols-[2fr,1fr] lg:gap-5">
                <Panel title={`Diary · ${date}`}>
                    {entries.length > 0 ? (
                        <div className="space-y-3">
                            {entries.map((entry) => (
                                <article
                                    key={entry.id}
                                    className="rounded-xl border border-light-border/70 p-3 dark:border-dark-border/70"
                                >
                                    <div className="flex justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-medium text-light-primary dark:text-dark-primary">
                                                {entry.member?.name} ·{" "}
                                                <span className="capitalize">
                                                    {entry.meal_slot}
                                                </span>
                                            </p>
                                            <p className="text-sm text-light-secondary dark:text-dark-secondary">
                                                {entry.items?.map((item) => item.name).join(", ") ||
                                                    entry.status}
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0 text-right">
                                            <p className="font-semibold text-light-primary dark:text-dark-primary">
                                                {Math.round(entry.actual_nutrition?.calories || 0)}{" "}
                                                kcal
                                            </p>
                                            <p className="text-xs capitalize text-light-muted dark:text-dark-muted">
                                                {entry.status.replaceAll("_", " ")}
                                            </p>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-center">
                            <NotebookPen className="mx-auto mb-3 h-10 w-10 text-light-muted dark:text-dark-muted" />
                            <p className="text-sm text-light-secondary dark:text-dark-secondary">
                                No meals logged for this day. Add one using the form.
                            </p>
                        </div>
                    )}
                </Panel>
                <Panel title="Add diary item">
                    <form onSubmit={submit} className="space-y-3">
                        <div>
                            <InputLabel htmlFor="diary-member" value="Member" />
                            <select
                                id="diary-member"
                                value={form.household_member_id}
                                onChange={(e) =>
                                    setForm({ ...form, household_member_id: e.target.value })
                                }
                                className={`mt-1 ${inputClass}`}
                            >
                                {household.members?.map((member) => (
                                    <option key={member.id} value={member.id}>
                                        {member.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <InputLabel htmlFor="diary-slot" value="Meal" />
                                <select
                                    id="diary-slot"
                                    value={form.meal_slot}
                                    onChange={(e) =>
                                        setForm({ ...form, meal_slot: e.target.value })
                                    }
                                    className={`mt-1 ${inputClass} capitalize`}
                                >
                                    <option>breakfast</option>
                                    <option>lunch</option>
                                    <option>dinner</option>
                                    <option>snack</option>
                                </select>
                            </div>
                            <div>
                                <InputLabel htmlFor="diary-time" value="When" />
                                <input
                                    id="diary-time"
                                    type="datetime-local"
                                    value={form.consumed_at}
                                    onChange={(e) =>
                                        setForm({ ...form, consumed_at: e.target.value })
                                    }
                                    className={`mt-1 ${inputClass}`}
                                />
                            </div>
                        </div>
                        <div>
                            <InputLabel htmlFor="diary-name" value="Food or drink" />
                            <input
                                id="diary-name"
                                required
                                placeholder="e.g. Chicken adobo"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className={`mt-1 ${inputClass}`}
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="diary-cal" value="Calories (optional)" />
                            <input
                                id="diary-cal"
                                min="0"
                                step="0.1"
                                type="number"
                                placeholder="0"
                                value={form.calories}
                                onChange={(e) => setForm({ ...form, calories: e.target.value })}
                                className={`mt-1 ${inputClass}`}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={busy}
                            className="btn-primary w-full disabled:opacity-60"
                        >
                            {busy ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Plus className="mr-2 h-4 w-4" />
                            )}
                            Log meal
                        </button>
                    </form>
                </Panel>
            </div>
        </MealPlanningLayout>
    );
}

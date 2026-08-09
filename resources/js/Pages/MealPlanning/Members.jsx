import MealPlanningLayout, { Panel } from "@/Components/MealPlanning/MealPlanningLayout";
import InputLabel from "@/Components/InputLabel";
import { router } from "@inertiajs/react";
import { Plus, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";

const inputClass = "input-primary w-full border px-3 py-2 text-sm focus:ring-1 focus:outline-none";

const empty = {
    name: "",
    classification: "adult",
    role: "member",
    sex_at_birth: "",
    birth_date: "",
    height_cm: "",
    weight_kg: "",
    activity_level: "sedentary",
    nutrition_goal: "maintenance",
    calorie_counting_enabled: false,
    allergies: "",
    dietary_restrictions: "",
};
export default function Members({ household }) {
    const [form, setForm] = useState(empty);
    const add = async (event) => {
        event.preventDefault();
        try {
            await window.axios.post(route("meal-planning.api.members.store", household.id), {
                ...form,
                sex_at_birth: form.sex_at_birth || null,
                birth_date: form.birth_date || null,
                height_cm: form.height_cm || null,
                weight_kg: form.weight_kg || null,
                allergies: form.allergies
                    .split(",")
                    .map((v) => v.trim())
                    .filter(Boolean),
                dietary_restrictions: form.dietary_restrictions
                    .split(",")
                    .map((v) => v.trim())
                    .filter(Boolean),
            });
            setForm(empty);
            toast.success("Member added.");
            router.reload();
        } catch {
            toast.error("We couldn’t add that member just now.");
        }
    };
    return (
        <MealPlanningLayout household={household} title="Nutrition Profiles">
            <div className="grid gap-4 lg:grid-cols-2">
                <Panel title="Household members">
                    {household.members.length > 0 ? (
                        <div className="space-y-3">
                            {household.members.map((member) => (
                                <article
                                    key={member.id}
                                    className="rounded-xl bg-light-hover p-3 dark:bg-dark-hover"
                                >
                                    <div className="flex justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-medium text-light-primary dark:text-dark-primary">
                                                {member.name}
                                            </p>
                                            <p className="text-sm capitalize text-light-secondary dark:text-dark-secondary">
                                                {member.classification} · {member.role}
                                            </p>
                                        </div>
                                        <span className="flex-shrink-0 text-right text-sm text-light-secondary dark:text-dark-secondary">
                                            {member.nutrition_targets?.calories
                                                ? `${member.nutrition_targets.calories} kcal`
                                                : "Target calculated when complete"}
                                        </span>
                                    </div>
                                    {member.allergies?.length > 0 && (
                                        <p className="mt-2 text-xs text-warning-700 dark:text-warning-300">
                                            Allergies: {member.allergies.join(", ")}
                                        </p>
                                    )}
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-center">
                            <Users className="mx-auto mb-3 h-10 w-10 text-light-muted dark:text-dark-muted" />
                            <p className="text-sm text-light-secondary dark:text-dark-secondary">
                                No members yet. Add household members to tailor nutrition targets.
                            </p>
                        </div>
                    )}
                </Panel>
                <Panel title="Add member or dependent">
                    <form onSubmit={add} className="grid gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <InputLabel htmlFor="m-name" value="Name" />
                            <input
                                id="m-name"
                                required
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="Full name"
                                className={`mt-1 ${inputClass}`}
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="m-class" value="Classification" />
                            <select
                                id="m-class"
                                value={form.classification}
                                onChange={(e) =>
                                    setForm({ ...form, classification: e.target.value })
                                }
                                className={`mt-1 ${inputClass}`}
                            >
                                <option value="adult">Adult</option>
                                <option value="child">Child</option>
                            </select>
                        </div>
                        <div>
                            <InputLabel htmlFor="m-sex" value="Sex at birth (optional)" />
                            <select
                                id="m-sex"
                                value={form.sex_at_birth}
                                onChange={(e) => setForm({ ...form, sex_at_birth: e.target.value })}
                                className={`mt-1 ${inputClass}`}
                            >
                                <option value="">Not specified</option>
                                <option value="female">Female</option>
                                <option value="male">Male</option>
                            </select>
                        </div>
                        <div>
                            <InputLabel htmlFor="m-birth" value="Birth date" />
                            <input
                                id="m-birth"
                                type="date"
                                value={form.birth_date}
                                onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
                                className={`mt-1 ${inputClass}`}
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="m-height" value="Height (cm)" />
                            <input
                                id="m-height"
                                type="number"
                                step="0.1"
                                value={form.height_cm}
                                onChange={(e) => setForm({ ...form, height_cm: e.target.value })}
                                placeholder="0"
                                className={`mt-1 ${inputClass}`}
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="m-weight" value="Weight (kg)" />
                            <input
                                id="m-weight"
                                type="number"
                                step="0.1"
                                value={form.weight_kg}
                                onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
                                placeholder="0"
                                className={`mt-1 ${inputClass}`}
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="m-allergies" value="Allergies" />
                            <input
                                id="m-allergies"
                                value={form.allergies}
                                onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                                placeholder="Comma separated"
                                className={`mt-1 ${inputClass}`}
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="m-restrictions" value="Restrictions" />
                            <input
                                id="m-restrictions"
                                value={form.dietary_restrictions}
                                onChange={(e) =>
                                    setForm({ ...form, dietary_restrictions: e.target.value })
                                }
                                placeholder="Comma separated"
                                className={`mt-1 ${inputClass}`}
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <button type="submit" className="btn-primary w-full">
                                <Plus className="mr-2 h-4 w-4" />
                                Add member
                            </button>
                        </div>
                    </form>
                    <p className="mt-3 text-xs text-light-muted dark:text-dark-muted">
                        Automatic targets are estimates. Child profiles never receive an automatic
                        calorie deficit.
                    </p>
                </Panel>
            </div>
        </MealPlanningLayout>
    );
}

import MealPlanningLayout, { Panel } from "@/Components/MealPlanning/MealPlanningLayout";
import { router } from "@inertiajs/react";
import { useState } from "react";

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
        router.reload();
    };
    return (
        <MealPlanningLayout household={household} title="Nutrition Profiles">
            <div className="grid gap-4 lg:grid-cols-2">
                <Panel title="Household members">
                    {household.members.map((member) => (
                        <article
                            key={member.id}
                            className="mb-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-900"
                        >
                            <div className="flex justify-between">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {member.name}
                                    </p>
                                    <p className="text-sm capitalize text-gray-500">
                                        {member.classification} · {member.role}
                                    </p>
                                </div>
                                <span className="text-sm text-gray-500">
                                    {member.nutrition_targets?.calories
                                        ? `${member.nutrition_targets.calories} kcal`
                                        : "Target calculated when complete"}
                                </span>
                            </div>
                            {member.allergies?.length > 0 && (
                                <p className="mt-2 text-xs text-amber-700">
                                    Allergies: {member.allergies.join(", ")}
                                </p>
                            )}
                        </article>
                    ))}
                </Panel>
                <Panel title="Add member or dependent">
                    <form onSubmit={add} className="grid gap-3 sm:grid-cols-2">
                        <input
                            required
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="Name"
                            className="rounded-lg border-gray-300 dark:bg-gray-900"
                        />
                        <select
                            value={form.classification}
                            onChange={(e) => setForm({ ...form, classification: e.target.value })}
                            className="rounded-lg border-gray-300 dark:bg-gray-900"
                        >
                            <option value="adult">Adult</option>
                            <option value="child">Child</option>
                        </select>
                        <select
                            value={form.sex_at_birth}
                            onChange={(e) => setForm({ ...form, sex_at_birth: e.target.value })}
                            className="rounded-lg border-gray-300 dark:bg-gray-900"
                        >
                            <option value="">Sex at birth (optional)</option>
                            <option value="female">Female</option>
                            <option value="male">Male</option>
                        </select>
                        <input
                            type="date"
                            value={form.birth_date}
                            onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
                            className="rounded-lg border-gray-300 dark:bg-gray-900"
                        />
                        <input
                            type="number"
                            step="0.1"
                            value={form.height_cm}
                            onChange={(e) => setForm({ ...form, height_cm: e.target.value })}
                            placeholder="Height (cm)"
                            className="rounded-lg border-gray-300 dark:bg-gray-900"
                        />
                        <input
                            type="number"
                            step="0.1"
                            value={form.weight_kg}
                            onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
                            placeholder="Weight (kg)"
                            className="rounded-lg border-gray-300 dark:bg-gray-900"
                        />
                        <input
                            value={form.allergies}
                            onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                            placeholder="Allergies, comma separated"
                            className="rounded-lg border-gray-300 dark:bg-gray-900"
                        />
                        <input
                            value={form.dietary_restrictions}
                            onChange={(e) =>
                                setForm({ ...form, dietary_restrictions: e.target.value })
                            }
                            placeholder="Restrictions, comma separated"
                            className="rounded-lg border-gray-300 dark:bg-gray-900"
                        />
                        <button className="rounded-lg bg-primary-600 px-4 py-2 text-white sm:col-span-2">
                            Add member
                        </button>
                    </form>
                    <p className="mt-3 text-xs text-gray-500">
                        Automatic targets are estimates. Child profiles never receive an automatic
                        calorie deficit.
                    </p>
                </Panel>
            </div>
        </MealPlanningLayout>
    );
}

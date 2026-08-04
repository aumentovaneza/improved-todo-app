import MealPlanningLayout, { Panel } from "@/Components/MealPlanning/MealPlanningLayout";
import { router } from "@inertiajs/react";
import { useState } from "react";

export default function Pantry({ household, pantryItems = [], ingredients = [] }) {
    const [form, setForm] = useState({
        ingredient_id: ingredients[0]?.id || "",
        quantity: "",
        unit: "g",
        expires_on: "",
    });
    const add = async (event) => {
        event.preventDefault();
        await window.axios.post(route("meal-planning.api.pantry.store", household.id), {
            ...form,
            quantity: Number(form.quantity),
            expires_on: form.expires_on || null,
        });
        setForm({ ...form, quantity: "", expires_on: "" });
        router.reload();
    };
    return (
        <MealPlanningLayout household={household} title="Pantry">
            <Panel title="Add pantry stock">
                <form onSubmit={add} className="grid gap-3 sm:grid-cols-4">
                    <select
                        value={form.ingredient_id}
                        onChange={(e) => setForm({ ...form, ingredient_id: e.target.value })}
                        className="rounded-lg border-gray-300 dark:bg-gray-900"
                    >
                        {ingredients.map((ingredient) => (
                            <option key={ingredient.id} value={ingredient.id}>
                                {ingredient.canonical_name}
                            </option>
                        ))}
                    </select>
                    <input
                        required
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.quantity}
                        onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                        placeholder="Quantity"
                        className="rounded-lg border-gray-300 dark:bg-gray-900"
                    />
                    <select
                        value={form.unit}
                        onChange={(e) => setForm({ ...form, unit: e.target.value })}
                        className="rounded-lg border-gray-300 dark:bg-gray-900"
                    >
                        {["g", "kg", "ml", "l", "tsp", "tbsp", "cup", "piece"].map((unit) => (
                            <option key={unit}>{unit}</option>
                        ))}
                    </select>
                    <button className="rounded-lg bg-primary-600 px-4 py-2 text-white">Add</button>
                    <input
                        type="date"
                        value={form.expires_on}
                        onChange={(e) => setForm({ ...form, expires_on: e.target.value })}
                        className="rounded-lg border-gray-300 dark:bg-gray-900"
                    />
                </form>
            </Panel>
            <Panel title="Current stock" className="mt-4">
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {pantryItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between py-3">
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {item.ingredient?.canonical_name}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {item.available_quantity} {item.unit} available ·{" "}
                                    {item.reserved_quantity} reserved
                                </p>
                            </div>
                            <span className="text-sm text-gray-500">
                                {item.expires_on ? `Expires ${item.expires_on}` : "No expiry"}
                            </span>
                        </div>
                    ))}
                    {pantryItems.length === 0 && (
                        <p className="py-6 text-center text-gray-500">No pantry items yet.</p>
                    )}
                </div>
            </Panel>
        </MealPlanningLayout>
    );
}

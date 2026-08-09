import MealPlanningLayout, { Panel } from "@/Components/MealPlanning/MealPlanningLayout";
import InputLabel from "@/Components/InputLabel";
import { router } from "@inertiajs/react";
import { Package, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";

const inputClass = "input-primary w-full border px-3 py-2 text-sm focus:ring-1 focus:outline-none";

export default function Pantry({ household, pantryItems = [], ingredients = [] }) {
    const [form, setForm] = useState({
        ingredient_id: ingredients[0]?.id || "",
        quantity: "",
        unit: "g",
        expires_on: "",
    });
    const add = async (event) => {
        event.preventDefault();
        try {
            await window.axios.post(route("meal-planning.api.pantry.store", household.id), {
                ...form,
                quantity: Number(form.quantity),
                expires_on: form.expires_on || null,
            });
            setForm({ ...form, quantity: "", expires_on: "" });
            toast.success("Pantry stock added.");
            router.reload();
        } catch {
            toast.error("We couldn’t add that item just now.");
        }
    };
    return (
        <MealPlanningLayout household={household} title="Pantry">
            <Panel title="Add pantry stock">
                <form onSubmit={add} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <InputLabel htmlFor="pantry-ingredient" value="Ingredient" />
                        <select
                            id="pantry-ingredient"
                            value={form.ingredient_id}
                            onChange={(e) => setForm({ ...form, ingredient_id: e.target.value })}
                            className={`mt-1 ${inputClass}`}
                        >
                            {ingredients.map((ingredient) => (
                                <option key={ingredient.id} value={ingredient.id}>
                                    {ingredient.canonical_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <InputLabel htmlFor="pantry-qty" value="Quantity" />
                        <input
                            id="pantry-qty"
                            required
                            type="number"
                            step="0.01"
                            min="0"
                            value={form.quantity}
                            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                            placeholder="0"
                            className={`mt-1 ${inputClass}`}
                        />
                    </div>
                    <div>
                        <InputLabel htmlFor="pantry-unit" value="Unit" />
                        <select
                            id="pantry-unit"
                            value={form.unit}
                            onChange={(e) => setForm({ ...form, unit: e.target.value })}
                            className={`mt-1 ${inputClass}`}
                        >
                            {["g", "kg", "ml", "l", "tsp", "tbsp", "cup", "piece"].map((unit) => (
                                <option key={unit}>{unit}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <InputLabel htmlFor="pantry-expiry" value="Expires on" />
                        <input
                            id="pantry-expiry"
                            type="date"
                            value={form.expires_on}
                            onChange={(e) => setForm({ ...form, expires_on: e.target.value })}
                            className={`mt-1 ${inputClass}`}
                        />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-4">
                        <button type="submit" className="btn-primary">
                            <Plus className="mr-2 h-4 w-4" />
                            Add stock
                        </button>
                    </div>
                </form>
            </Panel>
            <Panel title="Current stock">
                {pantryItems.length > 0 ? (
                    <div className="divide-y divide-light-border/70 dark:divide-white/10">
                        {pantryItems.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                            >
                                <div className="min-w-0">
                                    <p className="font-medium text-light-primary dark:text-dark-primary">
                                        {item.ingredient?.canonical_name}
                                    </p>
                                    <p className="text-sm text-light-secondary dark:text-dark-secondary">
                                        {item.available_quantity} {item.unit} available ·{" "}
                                        {item.reserved_quantity} reserved
                                    </p>
                                </div>
                                <span
                                    className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                                        item.expires_on
                                            ? "bg-warning-500/10 text-warning-700 dark:text-warning-300"
                                            : "bg-light-hover text-light-muted dark:bg-dark-hover dark:text-dark-muted"
                                    }`}
                                >
                                    {item.expires_on ? `Expires ${item.expires_on}` : "No expiry"}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-8 text-center">
                        <Package className="mx-auto mb-3 h-10 w-10 text-light-muted dark:text-dark-muted" />
                        <p className="text-sm text-light-secondary dark:text-dark-secondary">
                            No pantry items yet. Add stock above to track what you have on hand.
                        </p>
                    </div>
                )}
            </Panel>
        </MealPlanningLayout>
    );
}

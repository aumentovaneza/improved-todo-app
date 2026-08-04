import MealPlanningLayout, { Panel } from "@/Components/MealPlanning/MealPlanningLayout";

export default function GroceryList({ household, shoppingList }) {
    return (
        <MealPlanningLayout household={household} title="Grocery list">
            <Panel title="Forecast grocery list">
                {!shoppingList ? (
                    <p className="text-sm text-gray-500">
                        Generate a meal plan to build a list from normalized ingredients.
                    </p>
                ) : (
                    <>
                        <div className="mb-4 grid gap-3 sm:grid-cols-3">
                            <Summary
                                label="Known total"
                                value={`${household.currency} ${Number(shoppingList.known_cost_total || 0).toFixed(2)}`}
                            />
                            <Summary
                                label="Unknown prices"
                                value={shoppingList.unknown_price_count || 0}
                            />
                            <Summary label="Budget validation" value={shoppingList.budget_status} />
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {(shoppingList.items || []).map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between gap-3 py-3"
                                >
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {item.ingredient?.canonical_name ||
                                                `Ingredient #${item.ingredient_id}`}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Need {item.required_quantity} {item.unit}; pantry covers{" "}
                                            {item.pantry_quantity}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            Buy {item.purchase_quantity} {item.unit}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {item.estimated_cost == null
                                                ? "Price unknown"
                                                : `${household.currency} ${Number(item.estimated_cost).toFixed(2)}`}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </Panel>
        </MealPlanningLayout>
    );
}

function Summary({ label, value }) {
    return (
        <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
            <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
            <p className="mt-1 font-semibold capitalize text-gray-900 dark:text-white">{value}</p>
        </div>
    );
}

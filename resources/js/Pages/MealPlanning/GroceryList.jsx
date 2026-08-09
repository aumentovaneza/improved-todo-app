import MealPlanningLayout, { Panel } from "@/Components/MealPlanning/MealPlanningLayout";
import StatCard from "@/Components/Finance/UI/StatCard";
import { CircleHelp, Coins, ShoppingCart } from "lucide-react";

export default function GroceryList({ household, shoppingList }) {
    return (
        <MealPlanningLayout household={household} title="Grocery list">
            {!shoppingList ? (
                <div className="card p-8 text-center">
                    <div className="mb-4 text-light-muted dark:text-dark-muted">
                        <ShoppingCart className="mx-auto h-10 w-10 sm:h-12 sm:w-12" />
                    </div>
                    <h3 className="mb-1 text-base font-semibold text-light-primary dark:text-dark-primary sm:text-lg">
                        No grocery list yet
                    </h3>
                    <p className="text-sm text-light-secondary dark:text-dark-secondary">
                        Generate a meal plan to build a shopping list from normalized ingredients.
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <StatCard
                            label="Known total"
                            value={`${household.currency} ${Number(shoppingList.known_cost_total || 0).toFixed(2)}`}
                            icon={Coins}
                        />
                        <StatCard
                            label="Unknown prices"
                            value={shoppingList.unknown_price_count || 0}
                            icon={CircleHelp}
                            iconClassName="bg-warning-500/10 text-warning-600 dark:text-warning-400"
                        />
                        <StatCard
                            label="Budget validation"
                            value={<span className="capitalize">{shoppingList.budget_status}</span>}
                            icon={ShoppingCart}
                            iconClassName="bg-secondary-400/10 text-secondary-600 dark:text-secondary-300"
                        />
                    </div>
                    <Panel title="Forecast grocery list">
                        <div className="divide-y divide-light-border/70 dark:divide-white/10">
                            {(shoppingList.items || []).map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                                >
                                    <div className="min-w-0">
                                        <p className="font-medium text-light-primary dark:text-dark-primary">
                                            {item.ingredient?.canonical_name ||
                                                `Ingredient #${item.ingredient_id}`}
                                        </p>
                                        <p className="text-sm text-light-secondary dark:text-dark-secondary">
                                            Need {item.required_quantity} {item.unit}; pantry covers{" "}
                                            {item.pantry_quantity}
                                        </p>
                                    </div>
                                    <div className="flex-shrink-0 text-right">
                                        <p className="font-medium text-light-primary dark:text-dark-primary">
                                            Buy {item.purchase_quantity} {item.unit}
                                        </p>
                                        <p className="text-xs text-light-muted dark:text-dark-muted">
                                            {item.estimated_cost == null
                                                ? "Price unknown"
                                                : `${household.currency} ${Number(item.estimated_cost).toFixed(2)}`}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Panel>
                </>
            )}
        </MealPlanningLayout>
    );
}

import MealPlanningLayout, { Panel } from "@/Components/MealPlanning/MealPlanningLayout";
import { router } from "@inertiajs/react";
import { useState } from "react";

export default function Recipes({ household, recipes = [] }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [busy, setBusy] = useState(false);
    const search = async () => {
        setBusy(true);
        try {
            const response = await window.axios.get(
                route("meal-planning.api.recipes.provider-search", household.id),
                { params: { provider: "themealdb", query } }
            );
            setResults(response.data.data || []);
        } finally {
            setBusy(false);
        }
    };
    const importRecipe = async (recipe) => {
        await window.axios.post(route("meal-planning.api.recipes.import", household.id), {
            provider: recipe.provider,
            external_id: recipe.externalId,
            idempotency_key: crypto.randomUUID(),
        });
        window.setTimeout(() => router.reload(), 500);
    };
    return (
        <MealPlanningLayout household={household} title="Recipes">
            <Panel title="Find recipe references">
                <div className="flex gap-2">
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search TheMealDB"
                        className="min-w-0 flex-1 rounded-lg border-gray-300 dark:bg-gray-900"
                    />
                    <button
                        onClick={search}
                        disabled={busy}
                        className="rounded-lg bg-primary-600 px-4 py-2 text-white"
                    >
                        Search
                    </button>
                </div>
                {results.map((recipe) => (
                    <div
                        key={`${recipe.provider}-${recipe.externalId}`}
                        className="mt-3 flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-900"
                    >
                        <span>{recipe.name}</span>
                        <button
                            onClick={() => importRecipe(recipe)}
                            className="text-sm text-primary-600"
                        >
                            Import normalized copy
                        </button>
                    </div>
                ))}
            </Panel>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {recipes.map((recipe) => (
                    <article
                        key={recipe.id}
                        className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                    >
                        {recipe.image_url && (
                            <img
                                src={recipe.image_url}
                                alt=""
                                className="h-36 w-full object-cover"
                            />
                        )}
                        <div className="p-4">
                            <h2 className="font-semibold text-gray-900 dark:text-white">
                                {recipe.name}
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                {recipe.cuisine || "Wevie"} · {recipe.version?.servings || 0}{" "}
                                servings
                            </p>
                            <p className="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
                                {recipe.description}
                            </p>
                        </div>
                    </article>
                ))}
            </div>
        </MealPlanningLayout>
    );
}

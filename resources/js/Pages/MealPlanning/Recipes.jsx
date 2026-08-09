import MealPlanningLayout, { Panel } from "@/Components/MealPlanning/MealPlanningLayout";
import { router } from "@inertiajs/react";
import { BookOpen, Download, Loader2, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";

const inputClass =
    "input-primary min-w-0 flex-1 border px-3 py-2 text-sm focus:ring-1 focus:outline-none";

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
        } catch {
            toast.error("Recipe search failed. Please try again.");
        } finally {
            setBusy(false);
        }
    };
    const importRecipe = async (recipe) => {
        try {
            await window.axios.post(route("meal-planning.api.recipes.import", household.id), {
                provider: recipe.provider,
                external_id: recipe.externalId,
                idempotency_key: crypto.randomUUID(),
            });
            toast.success(`Importing “${recipe.name}”…`);
            window.setTimeout(() => router.reload(), 500);
        } catch {
            toast.error("We couldn’t import that recipe just now.");
        }
    };
    return (
        <MealPlanningLayout household={household} title="Recipes">
            <Panel title="Find recipe references">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        search();
                    }}
                    className="flex gap-2"
                >
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search TheMealDB"
                        className={inputClass}
                    />
                    <button
                        type="submit"
                        disabled={busy}
                        className="btn-primary flex-shrink-0 disabled:opacity-60"
                    >
                        {busy ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Search className="mr-2 h-4 w-4" />
                        )}
                        Search
                    </button>
                </form>
                {results.length > 0 && (
                    <div className="mt-3 space-y-2">
                        {results.map((recipe) => (
                            <div
                                key={`${recipe.provider}-${recipe.externalId}`}
                                className="flex items-center justify-between gap-3 rounded-xl bg-light-hover p-3 dark:bg-dark-hover"
                            >
                                <span className="min-w-0 truncate text-sm font-medium text-light-primary dark:text-dark-primary">
                                    {recipe.name}
                                </span>
                                <button
                                    onClick={() => importRecipe(recipe)}
                                    className="btn-secondary flex-shrink-0 px-3 py-1.5 text-sm"
                                >
                                    <Download className="mr-1.5 h-3.5 w-3.5" />
                                    Import
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </Panel>
            {recipes.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {recipes.map((recipe) => (
                        <article key={recipe.id} className="card overflow-hidden">
                            {recipe.image_url && (
                                <img
                                    src={recipe.image_url}
                                    alt=""
                                    className="h-36 w-full object-cover"
                                />
                            )}
                            <div className="p-4">
                                <h2 className="font-semibold text-light-primary dark:text-dark-primary">
                                    {recipe.name}
                                </h2>
                                <p className="mt-1 text-sm text-wevie-teal dark:text-wevie-mint">
                                    {recipe.cuisine || "Uncategorized"} ·{" "}
                                    {recipe.version?.servings || 0} servings
                                </p>
                                <p className="mt-2 line-clamp-2 text-sm text-light-secondary dark:text-dark-secondary">
                                    {recipe.description}
                                </p>
                            </div>
                        </article>
                    ))}
                </div>
            ) : (
                <div className="card p-8 text-center">
                    <div className="mb-4 text-light-muted dark:text-dark-muted">
                        <BookOpen className="mx-auto h-10 w-10 sm:h-12 sm:w-12" />
                    </div>
                    <h3 className="mb-1 text-base font-semibold text-light-primary dark:text-dark-primary sm:text-lg">
                        No recipes yet
                    </h3>
                    <p className="text-sm text-light-secondary dark:text-dark-secondary">
                        Search a provider above and import a normalized copy to build your library.
                    </p>
                </div>
            )}
        </MealPlanningLayout>
    );
}

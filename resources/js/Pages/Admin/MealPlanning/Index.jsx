import TodoLayout from "@/Layouts/TodoLayout";
import { Head, router } from "@inertiajs/react";

export default function Index({
    stats = {},
    duplicates = [],
    aliases = [],
    providerRequests = [],
}) {
    return (
        <TodoLayout>
            <Head title="Meal Planning Administration" />
            <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Meal Planning administration
                    </h1>
                    <p className="text-sm text-gray-500">
                        Normalization review, duplicates, and provider operations.
                    </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                    <Stat label="Recipes" value={stats.recipes || 0} />
                    <Stat label="Need review" value={stats.recipes_needing_review || 0} />
                    <Stat label="Suggested aliases" value={stats.suggested_aliases || 0} />
                </div>
                <Section title="Unmatched ingredient aliases">
                    {aliases.map((alias) => (
                        <Row
                            key={alias.id}
                            title={alias.alias}
                            detail={`Suggested: ${alias.ingredient?.canonical_name || "unknown"}`}
                            action={() =>
                                router.post(route("admin.meal-planning.aliases.confirm", alias.id))
                            }
                            actionLabel="Confirm"
                        />
                    ))}
                </Section>
                <Section title="Potential duplicate recipes">
                    {duplicates.map((candidate) => (
                        <Row
                            key={candidate.id}
                            title={`Recipe ${candidate.recipe_id} ↔ ${candidate.candidate_recipe_id}`}
                            detail={`Ingredient similarity ${candidate.ingredient_similarity}; instructions ${candidate.instruction_similarity}`}
                            action={() =>
                                router.post(
                                    route("admin.meal-planning.duplicates.resolve", candidate.id),
                                    { status: "distinct" }
                                )
                            }
                            actionLabel="Keep both"
                        />
                    ))}
                </Section>
                <Section title="Provider health and usage">
                    {providerRequests.slice(0, 30).map((request) => (
                        <Row
                            key={request.id}
                            title={`${request.provider} · ${request.operation}`}
                            detail={`${request.successful ? "successful" : "failed"} · ${request.duration_ms || 0}ms${request.error ? ` · ${request.error}` : ""}`}
                        />
                    ))}
                </Section>
            </div>
        </TodoLayout>
    );
}
function Stat({ label, value }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
    );
}
function Section({ title, children }) {
    return (
        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-3 font-semibold text-gray-900 dark:text-white">{title}</h2>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {children?.length ? (
                    children
                ) : (
                    <p className="py-3 text-sm text-gray-500">Nothing requires attention.</p>
                )}
            </div>
        </section>
    );
}
function Row({ title, detail, action, actionLabel }) {
    return (
        <div className="flex items-center justify-between gap-4 py-3">
            <div>
                <p className="font-medium text-gray-900 dark:text-white">{title}</p>
                <p className="text-sm text-gray-500">{detail}</p>
            </div>
            {action && (
                <button
                    onClick={action}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:text-white"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
}

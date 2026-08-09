import StatCard from "@/Components/Finance/UI/StatCard";
import TodoLayout from "@/Layouts/TodoLayout";
import { Head, router } from "@inertiajs/react";
import { AlertTriangle, BookOpen, Copy, Tags } from "lucide-react";

export default function Index({
    stats = {},
    duplicates = [],
    aliases = [],
    providerRequests = [],
}) {
    return (
        <TodoLayout
            header={
                <h2 className="text-base font-semibold text-light-primary dark:text-dark-primary sm:text-lg">
                    Meal Planning administration
                </h2>
            }
        >
            <Head title="Meal Planning Administration" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-light-primary dark:text-dark-primary">
                        Meal Planning administration
                    </h1>
                    <p className="mt-1 text-sm text-light-secondary dark:text-dark-secondary">
                        Normalization review, duplicates, and provider operations.
                    </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                    <StatCard label="Recipes" value={stats.recipes || 0} icon={BookOpen} />
                    <StatCard
                        label="Need review"
                        value={stats.recipes_needing_review || 0}
                        icon={AlertTriangle}
                        iconClassName="bg-warning-500/10 text-warning-600 dark:text-warning-400"
                    />
                    <StatCard
                        label="Suggested aliases"
                        value={stats.suggested_aliases || 0}
                        icon={Tags}
                        iconClassName="bg-secondary-400/10 text-secondary-600 dark:text-secondary-300"
                    />
                </div>
                <Section title="Unmatched ingredient aliases" icon={Tags}>
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
                <Section title="Potential duplicate recipes" icon={Copy}>
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
                            badge={
                                <span
                                    className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                                        request.successful
                                            ? "bg-success-500/10 text-success-600 dark:text-success-400"
                                            : "bg-error-500/10 text-error-600 dark:text-error-400"
                                    }`}
                                >
                                    {request.successful ? "successful" : "failed"}
                                </span>
                            }
                            detail={`${request.duration_ms || 0}ms${request.error ? ` · ${request.error}` : ""}`}
                        />
                    ))}
                </Section>
            </div>
        </TodoLayout>
    );
}

function Section({ title, icon: Icon, children }) {
    return (
        <section className="card overflow-hidden">
            <div className="flex items-center gap-2 border-b border-light-border/70 px-5 py-4 dark:border-dark-border/70">
                {Icon && (
                    <Icon
                        className="h-4 w-4 text-light-muted dark:text-dark-muted"
                        aria-hidden="true"
                    />
                )}
                <h2 className="font-semibold text-light-primary dark:text-dark-primary">{title}</h2>
            </div>
            <div className="divide-y divide-light-border/70 px-5 dark:divide-white/10">
                {children?.length ? (
                    children
                ) : (
                    <p className="py-4 text-sm text-light-secondary dark:text-dark-secondary">
                        Nothing requires attention.
                    </p>
                )}
            </div>
        </section>
    );
}

function Row({ title, detail, badge, action, actionLabel }) {
    return (
        <div className="flex items-center justify-between gap-4 py-3">
            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-light-primary dark:text-dark-primary">
                        {title}
                    </p>
                    {badge}
                </div>
                <p className="text-sm text-light-secondary dark:text-dark-secondary">{detail}</p>
            </div>
            {action && (
                <button
                    onClick={action}
                    className="btn-secondary flex-shrink-0 px-3 py-1.5 text-sm"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
}

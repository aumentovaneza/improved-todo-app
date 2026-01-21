import { Link } from "@inertiajs/react";

const formatCurrency = (value, currency = "PHP") =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(value ?? 0);

const formatDate = (value) =>
    value ? new Date(value).toLocaleDateString() : "-";

export default function SavingsGoalsList({
    goals = [],
    onDelete,
    onEdit,
    onConvert,
    onView,
    showAllHref,
}) {
    return (
        <div className="card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-light-primary dark:text-dark-primary">
                    Savings goals
                </h3>
                {showAllHref && (
                    <Link
                        href={showAllHref}
                        className="text-xs font-semibold text-wevie-teal hover:text-wevie-teal/80"
                    >
                        See all
                    </Link>
                )}
            </div>
            <div className="mt-4 space-y-3 text-sm text-light-secondary dark:text-dark-secondary">
                {goals.map((goal) => {
                    const progress =
                        goal.target_amount > 0
                            ? Math.min(
                                  100,
                                  Math.round(
                                      (goal.current_amount /
                                          goal.target_amount) *
                                          100
                                  )
                              )
                            : 0;

                    return (
                        <div
                            key={goal.id}
                            className="rounded-xl border border-light-border/70 px-3 py-2 dark:border-dark-border/70"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="font-medium text-light-primary dark:text-dark-primary">
                                        {goal.name}
                                    </p>
                                    <p className="text-xs text-light-muted dark:text-dark-muted">
                                        Target by {formatDate(goal.target_date)}
                                    </p>
                                    {goal.account?.name && (
                                        <p className="text-xs text-light-muted dark:text-dark-muted">
                                            Account: {goal.account.name}
                                        </p>
                                    )}
                                    {goal.converted_finance_budget_id && (
                                        <p className="text-xs text-emerald-600">
                                            Converted to budget
                                        </p>
                                    )}
                                </div>
                                <p className="font-semibold">
                                    {formatCurrency(
                                        goal.current_amount,
                                        goal.currency
                                    )}
                                </p>
                            </div>
                            <div className="mt-2">
                                <div className="h-2 w-full rounded-full bg-light-hover dark:bg-dark-hover">
                                    <div
                                        className="h-2 rounded-full bg-wevie-mint/80"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <div className="mt-1 flex items-center justify-between text-xs text-light-muted dark:text-dark-muted">
                                    <span>{progress}% saved</span>
                                    <span>
                                        {formatCurrency(
                                            goal.target_amount,
                                            goal.currency
                                        )}
                                    </span>
                                </div>
                                <div className="mt-2 flex justify-end">
                                    {onEdit && (
                                        <button
                                            type="button"
                                            onClick={() => onEdit?.(goal)}
                                            className="mr-3 text-xs font-semibold text-wevie-teal hover:text-wevie-teal/80"
                                        >
                                            Edit
                                        </button>
                                    )}
                                    {onView && (
                                        <button
                                            type="button"
                                            onClick={() => onView?.(goal)}
                                            className="mr-3 text-xs font-semibold text-light-secondary hover:text-light-primary dark:text-dark-secondary dark:hover:text-dark-primary"
                                        >
                                            View
                                        </button>
                                    )}
                                    {!goal.converted_finance_budget_id && (
                                        <button
                                            type="button"
                                            onClick={() => onConvert?.(goal)}
                                            className="mr-3 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-300 dark:hover:text-emerald-200"
                                        >
                                            Convert to budget
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => onDelete?.(goal)}
                                        className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-300 dark:hover:text-rose-200"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {(!goals || goals.length === 0) && (
                    <p className="text-sm text-light-muted dark:text-dark-muted">
                        No savings goals yet.
                    </p>
                )}
            </div>
        </div>
    );
}

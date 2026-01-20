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
    showAllHref,
}) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                    Savings goals
                </h3>
                {showAllHref && (
                    <Link
                        href={showAllHref}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                        Show all
                    </Link>
                )}
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
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
                            className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-slate-800 dark:text-slate-100">
                                        {goal.name}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        Target by {formatDate(goal.target_date)}
                                    </p>
                                </div>
                                <p className="font-semibold">
                                    {formatCurrency(
                                        goal.current_amount,
                                        goal.currency
                                    )}
                                </p>
                            </div>
                            <div className="mt-2">
                                <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800">
                                    <div
                                        className="h-2 rounded-full bg-emerald-500"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
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
                                            className="mr-3 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                                        >
                                            Edit
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => onDelete?.(goal)}
                                        className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {(!goals || goals.length === 0) && (
                    <p className="text-sm text-slate-400">
                        No savings goals yet.
                    </p>
                )}
            </div>
        </div>
    );
}

import { Link } from "@inertiajs/react";

const formatCurrency = (value, currency = "PHP") =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(value ?? 0);

const formatDate = (value) =>
    value ? new Date(value).toLocaleDateString() : "-";

export default function LoansList({
    loans = [],
    onDelete,
    onEdit,
    onView,
    showAllHref,
}) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                    Loans
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
                {loans.map((loan) => {
                    const progress =
                        loan.total_amount > 0
                            ? Math.min(
                                  100,
                                  Math.round(
                                      ((loan.total_amount -
                                          loan.remaining_amount) /
                                          loan.total_amount) *
                                          100
                                  )
                              )
                            : 0;

                    return (
                        <div
                            key={loan.id}
                            className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-slate-800 dark:text-slate-100">
                                        {loan.name}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        Due by {formatDate(loan.target_date)}
                                    </p>
                                </div>
                                <p className="font-semibold">
                                    {formatCurrency(
                                        loan.remaining_amount,
                                        loan.currency
                                    )}
                                </p>
                            </div>
                            <div className="mt-2">
                                <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800">
                                    <div
                                        className="h-2 rounded-full bg-amber-500"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                                    <span>{progress}% paid</span>
                                    <span>
                                        {formatCurrency(
                                            loan.total_amount,
                                            loan.currency
                                        )}
                                    </span>
                                </div>
                                <div className="mt-2 flex justify-end">
                                    {onEdit && (
                                        <button
                                            type="button"
                                            onClick={() => onEdit?.(loan)}
                                            className="mr-3 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                                        >
                                            Edit
                                        </button>
                                    )}
                                    {onView && (
                                        <button
                                            type="button"
                                            onClick={() => onView?.(loan)}
                                            className="mr-3 text-xs font-semibold text-slate-600 hover:text-slate-800"
                                        >
                                            View
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => onDelete?.(loan)}
                                        className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {(!loans || loans.length === 0) && (
                    <p className="text-sm text-slate-400">
                        No loans tracked yet.
                    </p>
                )}
            </div>
        </div>
    );
}

import { Link } from "@inertiajs/react";

const formatCurrency = (value, currency = "PHP") =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(value ?? 0);

const formatDate = (value) =>
    value ? new Date(value).toLocaleDateString() : "-";

import { Eye, Pencil, Trash2 } from "lucide-react";

export default function LoansList({
    loans = [],
    onDelete,
    onEdit,
    onView,
    showAllHref,
}) {
    return (
        <div className="card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-light-primary dark:text-dark-primary">
                    Loans
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
                            className="rounded-xl border border-light-border/70 px-3 py-2 dark:border-dark-border/70"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="font-medium text-light-primary dark:text-dark-primary">
                                        {loan.name}
                                    </p>
                                    <p className="text-xs text-light-muted dark:text-dark-muted">
                                        Target by {formatDate(loan.target_date)}
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
                                <div className="h-2 w-full rounded-full bg-light-hover dark:bg-dark-hover">
                                    <div
                                        className="h-2 rounded-full bg-wevie-teal/70"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <div className="mt-1 flex items-center justify-between text-xs text-light-muted dark:text-dark-muted">
                                    <span>{progress}% paid</span>
                                    <span>
                                        {formatCurrency(
                                            loan.total_amount,
                                            loan.currency
                                        )}
                                    </span>
                                </div>
                                <div className="mt-2 flex justify-end gap-2">
                                    {onEdit && (
                                        <button
                                            type="button"
                                            onClick={() => onEdit?.(loan)}
                                            className="rounded-md p-1 text-wevie-teal hover:text-wevie-teal/80"
                                            title="Edit"
                                            aria-label="Edit"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                    )}
                                    {onView && (
                                        <button
                                            type="button"
                                            onClick={() => onView?.(loan)}
                                            className="rounded-md p-1 text-light-secondary hover:text-light-primary dark:text-dark-secondary dark:hover:text-dark-primary"
                                            title="View"
                                            aria-label="View"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => onDelete?.(loan)}
                                        className="rounded-md p-1 text-rose-600 hover:text-rose-700 dark:text-rose-300 dark:hover:text-rose-200"
                                        title="Remove"
                                        aria-label="Remove"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {(!loans || loans.length === 0) && (
                    <p className="text-sm text-light-muted dark:text-dark-muted">
                        No loans tracked yet.
                    </p>
                )}
            </div>
        </div>
    );
}

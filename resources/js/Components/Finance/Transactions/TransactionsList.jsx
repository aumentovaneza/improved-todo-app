import { useEffect, useMemo, useState } from "react";

const formatAmount = (amount, currency = "PHP") =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
    }).format(amount ?? 0);

const formatDate = (value) =>
    value ? new Date(value).toLocaleDateString() : "-";

const typeStyles = {
    income: "text-emerald-600",
    expense: "text-rose-600",
    savings: "text-violet-600",
    loan: "text-cyan-600",
};

const formatFrequency = (frequency) =>
    frequency ? frequency.replace("-", " ") : "";

export default function TransactionsList({
    transactions = [],
    perPage = 8,
    onViewAll,
    isLoading,
    onDelete,
    onEdit,
}) {
    const [page, setPage] = useState(1);

    const totalPages = useMemo(
        () => Math.max(1, Math.ceil(transactions.length / perPage)),
        [transactions.length, perPage]
    );

    const pagedTransactions = useMemo(() => {
        const start = (page - 1) * perPage;
        return transactions.slice(start, start + perPage);
    }, [page, perPage, transactions]);

    useEffect(() => {
        setPage(1);
    }, [transactions]);

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages);
        }
    }, [page, totalPages]);

    return (
        <div className="card p-4">
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-light-primary dark:text-dark-primary">
                    Recent activity
                </h3>
                <button
                    type="button"
                    onClick={onViewAll}
                    disabled={isLoading}
                    className="rounded-xl bg-gradient-to-r from-wevie-teal to-wevie-mint px-3 py-1.5 text-sm text-white shadow-soft hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                    {isLoading ? "Loading..." : "See all"}
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-light-secondary dark:text-dark-secondary">
                    <thead className="text-xs uppercase text-light-muted dark:text-dark-muted">
                        <tr>
                            <th className="py-2">Description</th>
                            <th className="py-2">Category</th>
                            <th className="py-2">Account</th>
                            <th className="py-2">Date</th>
                            <th className="py-2 text-right">Amount</th>
                            <th className="py-2 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pagedTransactions.map((transaction) => (
                            <tr
                                key={transaction.id}
                                className="border-t border-light-border/70 dark:border-dark-border/70"
                            >
                                <td className="py-3">
                                    <div className="font-medium text-light-primary dark:text-dark-primary">
                                        {transaction.description}
                                    </div>
                                    <div className="text-xs capitalize text-light-muted dark:text-dark-muted">
                                        {transaction.type}
                                    </div>
                                    {transaction.created_by &&
                                        transaction.created_by.id !==
                                            transaction.user_id && (
                                            <div className="text-xs text-light-muted dark:text-dark-muted">
                                                Added by{" "}
                                                {transaction.created_by.name}
                                            </div>
                                        )}
                                    {transaction.is_recurring &&
                                        transaction.recurring_frequency && (
                                            <div className="text-xs text-violet-500 dark:text-violet-300">
                                                Steady:{" "}
                                                {formatFrequency(
                                                    transaction.recurring_frequency
                                                )}
                                            </div>
                                        )}
                                </td>
                                <td className="py-3">
                                    {transaction.category?.name ?? "Uncategorized"}
                                </td>
                                <td className="py-3">
                                    {transaction.account?.name ?? "—"}
                                </td>
                                <td className="py-3">
                                    {formatDate(transaction.occurred_at)}
                                </td>
                                <td
                                    className={`py-3 text-right font-medium ${
                                        typeStyles[transaction.type] ?? ""
                                    }`}
                                >
                                    {formatAmount(
                                        transaction.amount,
                                        transaction.currency ?? "PHP"
                                    )}
                                </td>
                                <td className="py-3 text-right">
                                    <div className="flex items-center justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                onEdit?.(transaction)
                                            }
                                            className="text-xs font-semibold text-wevie-teal hover:text-wevie-teal/80 dark:text-wevie-mint dark:hover:text-wevie-mint/80"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                onDelete?.(transaction)
                                            }
                                            className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-300 dark:hover:text-rose-200"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {pagedTransactions.length === 0 && (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="py-6 text-center text-sm text-light-muted dark:text-dark-muted"
                                >
                                    Nothing recorded yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {transactions.length > perPage && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-light-secondary dark:text-dark-secondary">
                    <span>
                        Showing {(page - 1) * perPage + 1}-
                        {Math.min(page * perPage, transactions.length)} of{" "}
                        {transactions.length}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                            disabled={page === 1}
                            className="rounded-xl border border-light-border/70 px-3 py-1 text-xs font-semibold text-light-secondary hover:border-light-border hover:text-light-primary disabled:cursor-not-allowed disabled:text-light-muted dark:border-dark-border/70 dark:text-dark-secondary dark:hover:text-dark-primary"
                        >
                            Prev
                        </button>
                        <span className="text-xs text-light-muted dark:text-dark-muted">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            type="button"
                            onClick={() =>
                                setPage((prev) =>
                                    Math.min(totalPages, prev + 1)
                                )
                            }
                            disabled={page === totalPages}
                            className="rounded-xl border border-light-border/70 px-3 py-1 text-xs font-semibold text-light-secondary hover:border-light-border hover:text-light-primary disabled:cursor-not-allowed disabled:text-light-muted dark:border-dark-border/70 dark:text-dark-secondary dark:hover:text-dark-primary"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

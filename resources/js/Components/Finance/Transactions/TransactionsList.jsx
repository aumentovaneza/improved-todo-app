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
};

const formatFrequency = (frequency) =>
    frequency ? frequency.replace("-", " ") : "";

export default function TransactionsList({
    transactions = [],
    onViewAll,
    isLoading,
    onDelete,
    onEdit,
}) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                    Recent transactions
                </h3>
                <button
                    type="button"
                    onClick={onViewAll}
                    disabled={isLoading}
                    className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white shadow hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
                >
                    {isLoading ? "Loading..." : "View all"}
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                    <thead className="text-xs uppercase text-slate-400">
                        <tr>
                            <th className="py-2">Description</th>
                            <th className="py-2">Category</th>
                            <th className="py-2">Date</th>
                            <th className="py-2 text-right">Amount</th>
                            <th className="py-2 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((transaction) => (
                            <tr
                                key={transaction.id}
                                className="border-t border-slate-200 dark:border-slate-700"
                            >
                                <td className="py-3">
                                    <div className="font-medium text-slate-800 dark:text-slate-100">
                                        {transaction.description}
                                    </div>
                                    <div className="text-xs capitalize text-slate-400">
                                        {transaction.type}
                                    </div>
                                    {transaction.is_recurring &&
                                        transaction.recurring_frequency && (
                                            <div className="text-xs text-purple-500">
                                                Recurring:{" "}
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
                                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                onDelete?.(transaction)
                                            }
                                            className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {transactions.length === 0 && (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="py-6 text-center text-sm text-slate-400"
                                >
                                    No transactions yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

import { useEffect, useMemo, useState } from "react";
import { Pencil, Receipt, Trash2 } from "lucide-react";
import Badge from "@/Components/Finance/UI/Badge";
import EmptyState from "@/Components/Finance/UI/EmptyState";
import ResponsiveTable from "@/Components/Finance/UI/ResponsiveTable";
import TransactionCard from "@/Components/Finance/Transactions/TransactionCard";
import { formatCurrency } from "@/Utils/currency";
import { TRANSACTION_LABEL, TRANSACTION_TONE } from "@/Utils/finance";

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : "-");

const formatFrequency = (frequency) => (frequency ? frequency.replace("-", " ") : "");

const amountTone = {
    income: "text-emerald-600 dark:text-emerald-300",
    expense: "text-rose-600 dark:text-rose-300",
    savings: "text-violet-600 dark:text-violet-300",
    loan: "text-cyan-600 dark:text-cyan-300",
    transfer: "text-sky-600 dark:text-sky-300",
};

const accountLabel = (transaction) => {
    if (transaction.type === "transfer") {
        const from = transaction.account?.label ?? transaction.account?.name ?? "—";
        const to =
            transaction.transfer_account?.label ??
            transaction.transfer_account?.name ??
            transaction.metadata?.external_account_name ??
            "External";
        return `${from} → ${to}`;
    }
    return transaction.account?.label ?? transaction.account?.name ?? "—";
};

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

    const columns = [
        {
            key: "description",
            header: "Description",
            render: (transaction) => (
                <div>
                    <div className="font-medium text-light-primary dark:text-dark-primary">
                        {transaction.description || "Untitled"}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Badge
                            label={TRANSACTION_LABEL[transaction.type] ?? transaction.type}
                            tone={TRANSACTION_TONE[transaction.type] ?? "neutral"}
                        />
                        {transaction.created_by &&
                            transaction.created_by.id !== transaction.user_id && (
                                <span className="text-xs text-light-muted dark:text-dark-muted">
                                    by {transaction.created_by.name}
                                </span>
                            )}
                    </div>
                    {transaction.is_recurring && transaction.recurring_frequency && (
                        <div className="mt-1 text-xs capitalize text-violet-500 dark:text-violet-300">
                            Steady: {formatFrequency(transaction.recurring_frequency)}
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: "category",
            header: "Category",
            render: (transaction) => transaction.category?.name ?? "Uncategorized",
        },
        {
            key: "account",
            header: "Account",
            render: accountLabel,
        },
        {
            key: "date",
            header: "Date",
            render: (transaction) => formatDate(transaction.occurred_at),
        },
        {
            key: "amount",
            header: "Amount",
            align: "right",
            render: (transaction) => (
                <span className={`font-medium ${amountTone[transaction.type] ?? ""}`}>
                    {formatCurrency(transaction.amount, transaction.currency ?? "PHP")}
                </span>
            ),
        },
        {
            key: "actions",
            header: "Actions",
            align: "right",
            render: (transaction) => (
                <div className="flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => onEdit?.(transaction)}
                        className="rounded-md p-1 text-wevie-teal hover:text-wevie-teal/80 dark:text-wevie-mint dark:hover:text-wevie-mint/80"
                        title="Edit"
                        aria-label="Edit"
                    >
                        <Pencil className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete?.(transaction)}
                        className="rounded-md p-1 text-rose-600 hover:text-rose-700 dark:text-rose-300 dark:hover:text-rose-200"
                        title="Remove"
                        aria-label="Remove"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            ),
        },
    ];

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

            <ResponsiveTable
                columns={columns}
                rows={pagedTransactions}
                keyField="id"
                renderCard={(transaction) => (
                    <TransactionCard
                        transaction={transaction}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                )}
                emptyState={
                    <EmptyState
                        icon={Receipt}
                        title="Nothing recorded yet"
                        description="Add your first income or expense to see it here."
                    />
                }
            />

            {transactions.length > perPage && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-light-secondary dark:text-dark-secondary">
                    <span>
                        Showing {(page - 1) * perPage + 1}-
                        {Math.min(page * perPage, transactions.length)} of {transactions.length}
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
                            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
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

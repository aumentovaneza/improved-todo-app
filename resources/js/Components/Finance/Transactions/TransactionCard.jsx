import { Pencil, Trash2 } from "lucide-react";
import Badge from "@/Components/Finance/UI/Badge";
import { formatCurrency } from "@/Utils/currency";
import { TRANSACTION_LABEL, TRANSACTION_TONE, transactionAmountPrefix } from "@/Utils/finance";

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

/**
 * Mobile-friendly card representation of a transaction — the stacked
 * counterpart to the desktop table row, with larger tap targets.
 */
export default function TransactionCard({ transaction, onEdit, onDelete }) {
    const type = transaction.type ?? "expense";
    const prefix = transactionAmountPrefix(type);

    return (
        <div className="rounded-xl border border-light-border/70 p-4 dark:border-dark-border/70">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate font-medium text-light-primary dark:text-dark-primary">
                        {transaction.description || "Untitled"}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Badge
                            label={TRANSACTION_LABEL[type] ?? type}
                            tone={TRANSACTION_TONE[type] ?? "neutral"}
                        />
                        <span className="text-xs text-light-muted dark:text-dark-muted">
                            {formatDate(transaction.occurred_at)}
                        </span>
                    </div>
                </div>
                <p className={`shrink-0 text-right font-semibold ${amountTone[type] ?? ""}`}>
                    {prefix}
                    {formatCurrency(transaction.amount, transaction.currency ?? "PHP")}
                </p>
            </div>

            <dl className="mt-3 space-y-1 text-xs text-light-muted dark:text-dark-muted">
                <div className="flex justify-between gap-2">
                    <dt>Category</dt>
                    <dd className="truncate text-right text-light-secondary dark:text-dark-secondary">
                        {transaction.category?.name ?? "Uncategorized"}
                    </dd>
                </div>
                <div className="flex justify-between gap-2">
                    <dt>Account</dt>
                    <dd className="truncate text-right text-light-secondary dark:text-dark-secondary">
                        {accountLabel(transaction)}
                    </dd>
                </div>
                {transaction.is_recurring && transaction.recurring_frequency && (
                    <div className="flex justify-between gap-2">
                        <dt>Repeats</dt>
                        <dd className="text-right capitalize text-violet-500 dark:text-violet-300">
                            {formatFrequency(transaction.recurring_frequency)}
                        </dd>
                    </div>
                )}
                {transaction.created_by && transaction.created_by.id !== transaction.user_id && (
                    <div className="flex justify-between gap-2">
                        <dt>Added by</dt>
                        <dd className="truncate text-right text-light-secondary dark:text-dark-secondary">
                            {transaction.created_by.name}
                        </dd>
                    </div>
                )}
            </dl>

            {(onEdit || onDelete) && (
                <div className="mt-3 flex items-center justify-end gap-1 border-t border-light-border/50 pt-3 dark:border-dark-border/50">
                    {onEdit && (
                        <button
                            type="button"
                            onClick={() => onEdit(transaction)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-wevie-teal hover:bg-light-hover dark:text-wevie-mint dark:hover:bg-dark-hover"
                        >
                            <Pencil className="h-4 w-4" />
                            Edit
                        </button>
                    )}
                    {onDelete && (
                        <button
                            type="button"
                            onClick={() => onDelete(transaction)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-900/20"
                        >
                            <Trash2 className="h-4 w-4" />
                            Remove
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

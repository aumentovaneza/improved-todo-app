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
    if (transaction.finance_credit_card_account_id) {
        const from = transaction.account?.label ?? transaction.account?.name;
        const card =
            transaction.credit_card_account?.label ??
            transaction.credit_card_account?.name;
        if (from && card) {
            return `${from} → ${card}`;
        }
        return from ?? card ?? "—";
    }

    if (transaction.type === "transfer" || transaction.type === "savings") {
        const from = transaction.account?.label ?? transaction.account?.name;
        const to =
            transaction.transfer_account?.label ??
            transaction.transfer_account?.name ??
            (transaction.type === "transfer"
                ? transaction.metadata?.external_account_name ?? "External"
                : null);
        if (from && to) {
            return `${from} → ${to}`;
        }
        if (from) {
            return from;
        }
        if (to) {
            return to;
        }
        return "—";
    }
    return transaction.account?.label ?? transaction.account?.name ?? "—";
};

/**
 * Compact mobile ledger row used below the desktop-table breakpoint.
 */
export default function TransactionCard({ transaction, onEdit, onDelete }) {
    const type = transaction.type ?? "expense";
    const prefix = transactionAmountPrefix(type);

    return (
        <div className="max-w-full rounded-lg border border-light-border/70 p-3 dark:border-dark-border/70">
            <div className="flex min-w-0 items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-light-primary dark:text-dark-primary">
                        {transaction.description || "Untitled"}
                    </p>
                    <div className="mt-1 flex min-w-0 items-center gap-1.5">
                        <Badge
                            label={TRANSACTION_LABEL[type] ?? type}
                            tone={TRANSACTION_TONE[type] ?? "neutral"}
                        />
                        <span className="min-w-0 truncate text-[11px] text-light-muted dark:text-dark-muted">
                            {transaction.category?.name ?? "Uncategorized"}
                        </span>
                        <span className="shrink-0 text-[11px] text-light-muted dark:text-dark-muted">
                            ·
                        </span>
                        <span className="shrink-0 text-[11px] text-light-muted dark:text-dark-muted">
                            {formatDate(transaction.occurred_at)}
                        </span>
                    </div>
                </div>
                <p
                    className={`shrink-0 text-right text-sm font-semibold ${
                        amountTone[type] ?? ""
                    }`}
                >
                    {prefix}
                    {formatCurrency(transaction.amount, transaction.currency ?? "PHP")}
                </p>
            </div>

            <div className="mt-2 flex min-w-0 items-center justify-between gap-2">
                <p className="min-w-0 truncate text-xs text-light-secondary dark:text-dark-secondary">
                    {accountLabel(transaction)}
                </p>
                {transaction.is_recurring && transaction.recurring_frequency && (
                    <span className="shrink-0 text-[11px] capitalize text-violet-500 dark:text-violet-300">
                        {formatFrequency(transaction.recurring_frequency)}
                    </span>
                )}
            </div>

            {transaction.created_by && transaction.created_by.id !== transaction.user_id && (
                <p className="mt-1 truncate text-[11px] text-light-muted dark:text-dark-muted">
                    Added by {transaction.created_by.name}
                </p>
            )}

            {(onEdit || onDelete) && (
                <div className="mt-2 flex items-center justify-end gap-1 border-t border-light-border/50 pt-2 dark:border-dark-border/50">
                    {onEdit && (
                        <button
                            type="button"
                            onClick={() => onEdit(transaction)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-wevie-teal hover:bg-light-hover dark:text-wevie-mint dark:hover:bg-dark-hover"
                            title="Edit transaction"
                            aria-label="Edit transaction"
                        >
                            <Pencil className="h-4 w-4" />
                        </button>
                    )}
                    {onDelete && (
                        <button
                            type="button"
                            onClick={() => onDelete(transaction)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-900/20"
                            title="Remove transaction"
                            aria-label="Remove transaction"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

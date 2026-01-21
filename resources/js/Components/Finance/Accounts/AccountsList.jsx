import { Pencil, Trash2 } from "lucide-react";

const formatCurrency = (value, currency = "PHP") =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
    }).format(value ?? 0);

const formatType = (type) => (type || "").replace("-", " ");

const maskAccountNumber = (value) => {
    if (!value) {
        return "";
    }
    const digits = String(value).replace(/\s+/g, "");
    if (digits.length <= 4) {
        return digits;
    }
    return `•••• ${digits.slice(-4)}`;
};

export default function AccountsList({ accounts = [], onEdit, onDelete }) {
    return (
        <div className="card p-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                Accounts
            </h3>
            <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                {accounts.map((account) => (
                    <div
                        key={account.id}
                        className="rounded-lg border border-light-border/70 px-3 py-2 dark:border-white/10"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="font-medium text-slate-800 dark:text-slate-100">
                                    {account.label || account.name}
                                </p>
                                {account.label && (
                                    <p className="text-xs text-slate-400">
                                        {account.name}
                                    </p>
                                )}
                                {account.account_number && (
                                    <p className="text-xs text-slate-400">
                                        {account.type === "credit-card"
                                            ? "Card"
                                            : "Account"}{" "}
                                        • {maskAccountNumber(account.account_number)}
                                    </p>
                                )}
                                <p className="text-xs capitalize text-slate-400">
                                    {formatType(account.type)}
                                </p>
                                {!account.is_active && (
                                    <p className="text-xs text-rose-500 dark:text-rose-400">
                                        Inactive
                                    </p>
                                )}
                                {account.notes && (
                                    <p className="mt-1 text-xs text-slate-400">
                                        {account.notes}
                                    </p>
                                )}
                            </div>
                            <div className="text-right text-sm">
                                {account.type === "credit-card" ? (
                                    <>
                                        <p className="font-semibold text-slate-800 dark:text-slate-100">
                                            Available:{" "}
                                            {formatCurrency(
                                                account.available_credit ?? 0,
                                                account.currency
                                            )}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            Used:{" "}
                                            {formatCurrency(
                                                account.used_credit ?? 0,
                                                account.currency
                                            )}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            Limit:{" "}
                                            {formatCurrency(
                                                account.credit_limit ?? 0,
                                                account.currency
                                            )}
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className="font-semibold text-slate-800 dark:text-slate-100">
                                            {formatCurrency(
                                                account.current_balance,
                                                account.currency
                                            )}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            Starting:{" "}
                                            {formatCurrency(
                                                account.starting_balance,
                                                account.currency
                                            )}
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="mt-2 flex justify-end gap-2">
                            {onEdit && (
                                <button
                                    type="button"
                                    onClick={() => onEdit?.(account)}
                                    className="rounded-md p-1 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                                    title="Edit"
                                    aria-label="Edit"
                                >
                                    <Pencil className="h-4 w-4" />
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => onDelete?.(account)}
                                className="rounded-md p-1 text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
                                title="Delete"
                                aria-label="Delete"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
                {(!accounts || accounts.length === 0) && (
                    <p className="text-sm text-slate-400 dark:text-slate-500">
                        No accounts yet.
                    </p>
                )}
            </div>
        </div>
    );
}

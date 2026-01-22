import { Link } from "@inertiajs/react";
import {
    CreditCard,
    Landmark,
    LineChart,
    Sparkles,
    Wallet,
} from "lucide-react";

const formatCurrency = (value, currency = "PHP") =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(value ?? 0);

const formatDate = (value) =>
    value ? new Date(value).toLocaleDateString() : "-";

const typeStyles = {
    income: "text-emerald-600 dark:text-emerald-300",
    expense: "text-rose-600 dark:text-rose-300",
    savings: "text-violet-600 dark:text-violet-300",
    loan: "text-cyan-600 dark:text-cyan-300",
    transfer: "text-sky-600 dark:text-sky-300",
};

export default function MobileWalletDashboard({
    summary,
    transactions = [],
    currency = "PHP",
    onViewAllTransactions,
}) {
    const cards = [
        {
            label: "Net balance",
            value: formatCurrency(summary?.net, currency),
            icon: Wallet,
        },
        {
            label: "Income",
            value: formatCurrency(summary?.income, currency),
            icon: Sparkles,
        },
        {
            label: "Spending",
            value: formatCurrency(summary?.expenses, currency),
            icon: CreditCard,
        },
        {
            label: "Savings",
            value: formatCurrency(summary?.savings, currency),
            icon: LineChart,
        },
    ];
    const links = [
        {
            label: "Budgets",
            description: "Plan monthly spending",
            href: route("weviewallet.budgets.index"),
            icon: LineChart,
        },
        {
            label: "Savings goals",
            description: "Track progress",
            href: route("weviewallet.savings-goals.index"),
            icon: Sparkles,
        },
        {
            label: "Loans",
            description: "Monitor balances",
            href: route("weviewallet.loans.index"),
            icon: Landmark,
        },
    ];

    const recentTransactions = transactions.slice(0, 4);

    return (
        <div className="space-y-4 lg:hidden">
            <div className="card p-4">
                <h2 className="text-base font-semibold text-light-primary dark:text-dark-primary">
                    WevieWallet
                </h2>
                <p className="mt-1 text-xs text-light-muted dark:text-dark-muted">
                    Quick glance at today's money picture.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {cards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div key={card.label} className="card p-3">
                            <div className="flex items-center gap-2">
                                <div className="rounded-lg bg-wevie-teal/10 p-2 text-wevie-teal">
                                    <Icon className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs text-light-muted dark:text-dark-muted">
                                        {card.label}
                                    </p>
                                    <p className="text-sm font-semibold text-light-primary dark:text-dark-primary">
                                        {card.value}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="card p-4">
                <h3 className="text-sm font-semibold text-light-primary dark:text-dark-primary">
                    Manage your wallet
                </h3>
                <div className="mt-3 grid grid-cols-1 gap-3">
                    {links.map((link) => {
                        const Icon = link.icon;
                        return (
                            <Link
                                key={link.label}
                                href={link.href}
                                className="flex items-center justify-between rounded-2xl border border-light-border/70 px-4 py-3 text-sm transition-colors duration-150 hover:border-wevie-teal/50 hover:bg-wevie-teal/5 dark:border-dark-border/70 dark:hover:border-wevie-teal/60"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="rounded-xl bg-wevie-teal/10 p-2 text-wevie-teal">
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-light-primary dark:text-dark-primary">
                                            {link.label}
                                        </p>
                                        <p className="text-xs text-light-muted dark:text-dark-muted">
                                            {link.description}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-xs font-semibold text-wevie-teal">
                                    Open
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            <div className="card p-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-light-primary dark:text-dark-primary">
                        Recent transactions
                    </h3>
                    {onViewAllTransactions ? (
                        <button
                            type="button"
                            onClick={onViewAllTransactions}
                            className="text-xs font-semibold text-wevie-teal hover:text-wevie-teal/80"
                        >
                            View all
                        </button>
                    ) : (
                        <Link
                            href={route("weviewallet.transactions.index")}
                            className="text-xs font-semibold text-wevie-teal hover:text-wevie-teal/80"
                        >
                            View all
                        </Link>
                    )}
                </div>
                <div className="mt-3 space-y-3 text-sm">
                    {recentTransactions.length === 0 && (
                        <p className="text-xs text-light-muted dark:text-dark-muted">
                            No transactions yet.
                        </p>
                    )}
                    {recentTransactions.map((transaction) => (
                        <div
                            key={transaction.id}
                            className="flex items-center justify-between rounded-xl border border-light-border/70 px-3 py-2 dark:border-dark-border/70"
                        >
                            <div>
                                <p className="text-sm font-medium text-light-primary dark:text-dark-primary">
                                    {transaction.description || "Transaction"}
                                </p>
                                <p className="text-xs text-light-muted dark:text-dark-muted">
                                    {transaction.category?.name ??
                                        transaction.type ??
                                        "Uncategorized"}{" "}
                                    - {formatDate(transaction.occurred_at)}
                                </p>
                            </div>
                            <span
                                className={`text-sm font-semibold ${
                                    typeStyles[transaction.type] ?? ""
                                }`}
                            >
                                {formatCurrency(
                                    transaction.amount,
                                    transaction.currency ?? currency
                                )}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

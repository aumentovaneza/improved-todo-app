import {
    Coins,
    CreditCard,
    Landmark,
    PiggyBank,
    Scale,
    TrendingDown,
    TrendingUp,
    Wallet,
} from "lucide-react";
import StatCard from "@/Components/Finance/UI/StatCard";
import { formatWholeCurrency } from "@/Utils/currency";

export default function SummaryCards({
    summary,
    currency = "PHP",
    netWorth,
    onIncomeClick,
    onUnallocatedClick,
    onExpensesClick,
    onSavingsClick,
    onNetClick,
    onLoansClick,
    onAvailableCreditClick,
}) {
    const cards = [
        {
            label: "Net worth",
            value: formatWholeCurrency(netWorth, currency),
            icon: Coins,
            iconClassName: "bg-wevie-teal/10 text-wevie-teal",
            accent: "text-light-primary dark:text-dark-primary",
        },
        {
            label: "Income",
            value: formatWholeCurrency(summary?.income, currency),
            icon: TrendingUp,
            iconClassName:
                "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300",
            accent: "text-emerald-600 dark:text-emerald-300",
            onClick: onIncomeClick,
        },
        {
            label: "Spending",
            value: formatWholeCurrency(summary?.expenses, currency),
            icon: TrendingDown,
            iconClassName: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300",
            accent: "text-rose-600 dark:text-rose-300",
            onClick: onExpensesClick,
        },
        {
            label: "Savings",
            value: formatWholeCurrency(summary?.savings, currency),
            icon: PiggyBank,
            iconClassName:
                "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300",
            accent: "text-violet-600 dark:text-violet-300",
            onClick: onSavingsClick,
        },
        {
            label: "Net balance",
            value: formatWholeCurrency(summary?.net, currency),
            icon: Scale,
            iconClassName: "bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-200",
            accent: "text-slate-700 dark:text-slate-200",
            onClick: onNetClick,
        },
        {
            label: "Unassigned funds",
            value: formatWholeCurrency(summary?.unallocated, currency),
            icon: Wallet,
            iconClassName: "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-300",
            accent: "text-sky-600 dark:text-sky-300",
            onClick: onUnallocatedClick,
        },
        {
            label: "Available credit",
            value: formatWholeCurrency(summary?.available_credit, currency),
            icon: CreditCard,
            iconClassName: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300",
            accent: "text-amber-600 dark:text-amber-300",
            onClick: onAvailableCreditClick,
        },
        {
            label: "Total loans",
            value: formatWholeCurrency(summary?.loans, currency),
            icon: Landmark,
            iconClassName: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300",
            accent: "text-amber-600 dark:text-amber-300",
            onClick: onLoansClick,
        },
    ];

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
                <StatCard
                    key={card.label}
                    label={card.label}
                    value={card.value}
                    icon={card.icon}
                    iconClassName={card.iconClassName}
                    accent={card.accent}
                    onClick={card.onClick}
                />
            ))}
        </div>
    );
}

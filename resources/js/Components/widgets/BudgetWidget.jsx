import { PiggyBank, Wallet } from "lucide-react";
import WidgetFrame from "@/Components/Dashboard/WidgetFrame";
import StatCard from "@/Components/Finance/UI/StatCard";
import EmptyState from "@/Components/Finance/UI/EmptyState";
import { formatCurrency } from "@/Utils/currency";

function clampPercent(value) {
    if (!Number.isFinite(value)) return 0;
    return Math.min(100, Math.max(0, Math.round(value)));
}

/**
 * Budget snapshot. `budgets` is an array of Finance budget rows (`amount` is the
 * limit, `current_spent` the spend — matching the WevieWallet Budgets page).
 * Totals are derived from the rows themselves; the finance `summary` prop carries
 * cashflow figures (income/expenses/net), not budget totals, so we don't read it.
 */
export default function BudgetWidget({ data, dragHandleProps }) {
    const budgets = data?.budgets ?? [];

    const totalBudgeted = budgets.reduce((sum, b) => sum + Number(b.amount ?? 0), 0);
    const totalSpent = budgets.reduce((sum, b) => sum + Number(b.current_spent ?? 0), 0);
    const remaining = Math.max(0, totalBudgeted - totalSpent);

    return (
        <WidgetFrame
            title="Budgets"
            icon={PiggyBank}
            iconClassName="bg-secondary-100 text-secondary-500 dark:bg-secondary-900/30"
            dragHandleProps={dragHandleProps}
        >
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <StatCard
                        label="Budgeted"
                        value={formatCurrency(totalBudgeted)}
                        icon={Wallet}
                        iconClassName="bg-wevie-teal/10 text-wevie-teal"
                    />
                    <StatCard
                        label="Remaining"
                        value={formatCurrency(remaining)}
                        icon={PiggyBank}
                        iconClassName="bg-emerald-100/60 text-emerald-500 dark:bg-emerald-900/30"
                    />
                </div>

                {budgets.length === 0 ? (
                    <EmptyState
                        icon={PiggyBank}
                        title="No budgets yet"
                        description="Set a budget to track spending against it here."
                    />
                ) : (
                    <ul className="space-y-3">
                        {budgets.map((budget) => {
                            const limit = Number(budget.amount ?? 0);
                            const spent = Number(budget.current_spent ?? 0);
                            const pct = limit > 0 ? (spent / limit) * 100 : 0;
                            const over = spent > limit && limit > 0;
                            const name = budget.name || budget.category?.name || "Budget";

                            return (
                                <li key={budget.id ?? name} className="space-y-1">
                                    <div className="flex items-center justify-between gap-2 text-xs">
                                        <span className="truncate font-medium text-adaptive-primary">
                                            {name}
                                        </span>
                                        <span className="flex-shrink-0 text-adaptive-muted">
                                            {formatCurrency(spent)} / {formatCurrency(limit)}
                                        </span>
                                    </div>
                                    <div
                                        className="h-2 w-full overflow-hidden rounded-full bg-light-hover dark:bg-dark-hover"
                                        role="progressbar"
                                        aria-valuenow={clampPercent(pct)}
                                        aria-valuemin={0}
                                        aria-valuemax={100}
                                        aria-label={`${name} budget used`}
                                    >
                                        <div
                                            className={`h-full rounded-full ${
                                                over
                                                    ? "bg-rose-500"
                                                    : "bg-gradient-to-r from-wevie-teal to-wevie-mint"
                                            }`}
                                            style={{
                                                width: `${clampPercent(pct)}%`,
                                            }}
                                        />
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </WidgetFrame>
    );
}

import { PiggyBank, Target } from "lucide-react";
import WidgetFrame from "@/Components/Dashboard/WidgetFrame";
import StatCard from "@/Components/Finance/UI/StatCard";
import EmptyState from "@/Components/Finance/UI/EmptyState";
import { formatCurrency } from "@/Utils/currency";

function clampPercent(value) {
    if (!Number.isFinite(value)) return 0;
    return Math.min(100, Math.max(0, Math.round(value)));
}

/**
 * Savings goals snapshot. `data` is an array of Finance savings goals
 * (`current_amount` saved so far, `target_amount` the goal). Shows total saved
 * across goals plus a per-goal progress bar toward each target.
 */
export default function SavingsGoalsWidget({ data, dragHandleProps }) {
    const goals = data ?? [];

    const totalSaved = goals.reduce((sum, g) => sum + Number(g.current_amount ?? 0), 0);
    const totalTarget = goals.reduce((sum, g) => sum + Number(g.target_amount ?? 0), 0);

    return (
        <WidgetFrame
            title="Savings goals"
            icon={PiggyBank}
            iconClassName="bg-primary-100 text-primary-500 dark:bg-primary-900/30"
            dragHandleProps={dragHandleProps}
        >
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <StatCard
                        label="Saved"
                        value={formatCurrency(totalSaved)}
                        icon={PiggyBank}
                        iconClassName="bg-primary-100 text-primary-500 dark:bg-primary-900/30"
                    />
                    <StatCard
                        label="Target"
                        value={formatCurrency(totalTarget)}
                        icon={Target}
                        iconClassName="bg-secondary-100 text-secondary-500 dark:bg-secondary-900/30"
                    />
                </div>

                {goals.length === 0 ? (
                    <EmptyState
                        icon={PiggyBank}
                        title="No savings goals yet"
                        description="Set a savings goal to track your progress here."
                    />
                ) : (
                    <ul className="space-y-3">
                        {goals.map((goal) => {
                            const saved = Number(goal.current_amount ?? 0);
                            const target = Number(goal.target_amount ?? 0);
                            const pct = target > 0 ? (saved / target) * 100 : 0;
                            const reached = saved >= target && target > 0;
                            const name = goal.name || "Savings goal";

                            return (
                                <li key={goal.id ?? name} className="space-y-1">
                                    <div className="flex items-center justify-between gap-2 text-xs">
                                        <span className="truncate font-medium text-adaptive-primary">
                                            {name}
                                        </span>
                                        <span className="flex-shrink-0 text-adaptive-muted">
                                            {formatCurrency(saved)} / {formatCurrency(target)}
                                        </span>
                                    </div>
                                    <div
                                        className="h-2 w-full overflow-hidden rounded-full bg-light-hover dark:bg-dark-hover"
                                        role="progressbar"
                                        aria-valuenow={clampPercent(pct)}
                                        aria-valuemin={0}
                                        aria-valuemax={100}
                                        aria-label={`${name} progress`}
                                    >
                                        <div
                                            className={`h-full rounded-full ${
                                                reached
                                                    ? "bg-emerald-500"
                                                    : "bg-gradient-to-r from-wevie-teal to-wevie-mint"
                                            }`}
                                            style={{ width: `${clampPercent(pct)}%` }}
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

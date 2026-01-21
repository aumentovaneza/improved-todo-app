import { Card, DonutChart, Title } from "@tremor/react";
import { getNearestTremorColorName } from "./chartColors";

const formatCurrency = (value, currency = "PHP") =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(value ?? 0);

const getCenterSummary = (data, currency) => {
    const totals = data.reduce(
        (acc, item) => {
            if (item.type === "savings") {
                acc.savings += item.total ?? 0;
            } else {
                acc.expense += item.total ?? 0;
            }
            return acc;
        },
        { expense: 0, savings: 0 }
    );

    if (totals.expense === 0 && totals.savings === 0) {
        return { label: "No data", tone: "none" };
    }

    if (totals.expense === totals.savings) {
        return {
            label: `Even split · ${formatCurrency(totals.expense, currency)}`,
            tone: "even",
        };
    }

    if (totals.expense > totals.savings) {
        return {
            label: `Spending leads · ${formatCurrency(
                totals.expense,
                currency
            )}`,
            tone: "spending",
        };
    }

    return {
        label: `Savings leads · ${formatCurrency(totals.savings, currency)}`,
        tone: "savings",
    };
};

const formatPeriodLabel = (period) => {
    if (!period?.start || !period?.end) {
        return null;
    }
    const startDate = new Date(period.start);
    const endDate = new Date(period.end);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        return null;
    }
    const label = `${startDate.toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
    })} - ${endDate.toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
    })}`;
    return label;
};

export default function CategoryBreakdownChart({
    data = [],
    currency = "PHP",
    period,
}) {
    const isDark =
        typeof document !== "undefined" &&
        document.documentElement.classList.contains("dark");
    const expenseColor = isDark ? "#9F1239" : "#F43F5E";
    const savingsColor = isDark ? "#047857" : "#10B981";
    const chartColors = data.map((item) => {
        if (item?.type === "expense") {
            return getNearestTremorColorName(expenseColor);
        }
        if (item?.type === "savings") {
            return getNearestTremorColorName(savingsColor);
        }
        return item?.color ? getNearestTremorColorName(item.color) : "slate";
    });

    const centerSummary = getCenterSummary(data, currency);
    const centerTextClass = {
        spending: "text-rose-600 dark:text-rose-300/80",
        savings: "text-emerald-600 dark:text-emerald-300/80",
        even: "text-slate-500 dark:text-slate-400",
        none: "text-slate-400",
    }[centerSummary.tone];
    const periodLabel = formatPeriodLabel(period);

    return (
        <Card>
            <Title>Spending & Savings by category</Title>
            {periodLabel && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Current month · {periodLabel}
                </p>
            )}
            <div className="relative">
                <DonutChart
                    className="mt-4 h-64"
                    data={data}
                    category="total"
                    index="label"
                    valueFormatter={(value) => formatCurrency(value, currency)}
                    colors={chartColors}
                    showLabel={false}
                    showTooltip={false}
                />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span
                        className={`text-center text-sm font-semibold ${centerTextClass}`}
                    >
                        {centerSummary.label}
                    </span>
                </div>
            </div>
        </Card>
    );
}

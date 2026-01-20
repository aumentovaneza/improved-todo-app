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

export default function CategoryBreakdownChart({
    data = [],
    currency = "PHP",
}) {
    const chartColors = data.map((item) =>
        item?.color ? getNearestTremorColorName(item.color) : "slate"
    );

    const centerSummary = getCenterSummary(data, currency);
    const centerTextClass = {
        spending: "text-rose-600",
        savings: "text-emerald-600",
        even: "text-slate-500 dark:text-slate-400",
        none: "text-slate-400",
    }[centerSummary.tone];

    return (
        <Card>
            <Title>Spending & Savings by category</Title>
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

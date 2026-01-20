import { Card, DonutChart, Title } from "@tremor/react";
import { getNearestTremorColorName } from "./chartColors";

const formatCurrency = (value, currency = "PHP") =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(value ?? 0);

const getCenterLabel = (data, currency) => {
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
        return "No data";
    }

    if (totals.expense === totals.savings) {
        return `Even split · ${formatCurrency(totals.expense, currency)}`;
    }

    if (totals.expense > totals.savings) {
        return `Spending leads · ${formatCurrency(totals.expense, currency)}`;
    }

    return `Savings leads · ${formatCurrency(totals.savings, currency)}`;
};

export default function CategoryBreakdownChart({
    data = [],
    currency = "PHP",
}) {
    const chartColors = data.map((item) =>
        item?.color ? getNearestTremorColorName(item.color) : "slate"
    );

    const centerLabel = getCenterLabel(data, currency);

    return (
        <Card>
            <Title>Spending & Savings by category</Title>
            <DonutChart
                className="mt-4 h-64"
                data={data}
                category="total"
                index="label"
                valueFormatter={(value) => formatCurrency(value, currency)}
                colors={chartColors}
                label={centerLabel}
                showLabel
                showTooltip={false}
            />
        </Card>
    );
}

import { Card, LineChart, Title } from "@tremor/react";
import { getTremorColorsFromHex } from "./chartColors";

const formatCurrency = (value, currency = "PHP") =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(value ?? 0);

export default function TrendsChart({ data = [], currency = "PHP" }) {
    const displayData = data.map((row) => ({
        ...row,
        Income: row.income ?? 0,
        Expenses: row.expense ?? 0,
        Savings: row.savings ?? 0,
    }));

    return (
        <Card>
            <Title>14-day trend</Title>
            <LineChart
                className="mt-4 h-64"
                data={displayData}
                index="period"
                categories={["Income", "Expenses", "Savings"]}
                colors={getTremorColorsFromHex([
                    "#10B981",
                    "#F43F5E",
                    "#8B5CF6",
                ])}
                valueFormatter={(value) => formatCurrency(value, currency)}
                showLegend
                showTooltip={false}
                xAxisLabel="Date"
                yAxisLabel={`Amount (${currency})`}
                yAxisWidth={80}
            />
        </Card>
    );
}

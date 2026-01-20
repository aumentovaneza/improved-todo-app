import { BarChart, Card, Title } from "@tremor/react";
import { getTremorColorsFromHex } from "./chartColors";

const formatCurrency = (value, currency = "PHP") =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(value ?? 0);

export default function IncomeExpenseChart({ data = [], currency = "PHP" }) {
    const displayData = data.map((row) => ({
        ...row,
        Income: row.income ?? 0,
        Expenses: row.expense ?? 0,
    }));

    return (
        <Card>
            <Title>Income vs Expenses</Title>
            <BarChart
                className="mt-4 h-64"
                data={displayData}
                index="period"
                categories={["Income", "Expenses"]}
                colors={getTremorColorsFromHex(["#10B981", "#F43F5E"])}
                valueFormatter={(value) => formatCurrency(value, currency)}
                showLegend
                showTooltip={false}
                xAxisLabel="Period"
                yAxisLabel={`Amount (${currency})`}
                yAxisWidth={80}
            />
        </Card>
    );
}

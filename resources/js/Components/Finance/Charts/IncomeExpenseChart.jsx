import { BarChart, Card, Title } from "@tremor/react";
import { getTremorColorsFromHex } from "./chartColors";

const formatCurrency = (value, currency = "PHP") =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(value ?? 0);

export default function IncomeExpenseChart({ data = [], currency = "PHP" }) {
    const isDark =
        typeof document !== "undefined" &&
        document.documentElement.classList.contains("dark");
    const displayData = data.map((row) => ({
        ...row,
        Income: row.income ?? 0,
        Expenses: row.expense ?? 0,
    }));
    const chartColors = getTremorColorsFromHex(
        isDark ? ["#047857", "#9F1239"] : ["#10B981", "#F43F5E"]
    );

    return (
        <Card>
            <Title>Income vs Expenses</Title>
            <BarChart
                className="mt-4 h-64"
                data={displayData}
                index="period"
                categories={["Income", "Expenses"]}
                colors={chartColors}
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

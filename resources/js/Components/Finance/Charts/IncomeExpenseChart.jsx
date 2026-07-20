import { BarChart } from "@tremor/react";
import ChartWrapper from "./ChartWrapper";
import { getTremorColorsFromHex } from "./chartColors";
import useIsDark from "@/Hooks/useIsDark";
import { formatWholeCurrency } from "@/Utils/currency";

export default function IncomeExpenseChart({ data = [], currency = "PHP", actions }) {
    const isDark = useIsDark();
    const displayData = data.map((row) => ({
        ...row,
        Income: row.income ?? 0,
        Expenses: row.expense ?? 0,
    }));
    const chartColors = getTremorColorsFromHex(
        isDark ? ["#047857", "#9F1239"] : ["#10B981", "#F43F5E"]
    );

    return (
        <ChartWrapper title="Income vs Expenses" actions={actions}>
            <BarChart
                className="mt-4 h-64"
                data={displayData}
                index="period"
                categories={["Income", "Expenses"]}
                colors={chartColors}
                valueFormatter={(value) => formatWholeCurrency(value, currency)}
                showLegend
                showTooltip
                xAxisLabel="Period"
                yAxisLabel={`Amount (${currency})`}
                yAxisWidth={80}
            />
        </ChartWrapper>
    );
}

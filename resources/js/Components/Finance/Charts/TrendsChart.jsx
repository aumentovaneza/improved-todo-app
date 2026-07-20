import { LineChart } from "@tremor/react";
import ChartWrapper from "./ChartWrapper";
import { getTremorColorsFromHex } from "./chartColors";
import useIsDark from "@/Hooks/useIsDark";
import { formatWholeCurrency } from "@/Utils/currency";

export default function TrendsChart({
    data = [],
    currency = "PHP",
    title = "14-day trend",
    actions,
}) {
    const isDark = useIsDark();
    const displayData = data.map((row) => ({
        ...row,
        Income: row.income ?? 0,
        Expenses: row.expense ?? 0,
        Savings: row.savings ?? 0,
    }));
    const chartColors = getTremorColorsFromHex(
        isDark ? ["#047857", "#9F1239", "#5B21B6"] : ["#10B981", "#F43F5E", "#8B5CF6"]
    );

    return (
        <ChartWrapper title={title} actions={actions}>
            <LineChart
                className="mt-4 h-64"
                data={displayData}
                index="period"
                categories={["Income", "Expenses", "Savings"]}
                colors={chartColors}
                valueFormatter={(value) => formatWholeCurrency(value, currency)}
                showLegend
                showTooltip
                xAxisLabel="Date"
                yAxisLabel={`Amount (${currency})`}
                yAxisWidth={80}
            />
        </ChartWrapper>
    );
}

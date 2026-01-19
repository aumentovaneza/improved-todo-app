import { BarChart, Card, Title } from "@tremor/react";

const formatCurrency = (value, currency = "PHP") =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(value ?? 0);

export default function TrendsChart({ data = [], currency = "PHP" }) {
    return (
        <Card>
            <Title>14-day trend</Title>
            <BarChart
                className="mt-4 h-64"
                data={data}
                index="period"
                categories={["income", "expense", "savings"]}
                colors={["emerald", "rose", "violet"]}
                valueFormatter={(value) => formatCurrency(value, currency)}
                showLegend
            />
        </Card>
    );
}

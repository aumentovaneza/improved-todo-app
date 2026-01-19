import { Card, DonutChart, Title } from "@tremor/react";

const formatCurrency = (value, currency = "PHP") =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(value ?? 0);

export default function CategoryBreakdownChart({
    data = [],
    currency = "PHP",
}) {
    return (
        <Card>
            <Title>Spending by category</Title>
            <DonutChart
                className="mt-4 h-64"
                data={data}
                category="total"
                index="name"
                valueFormatter={(value) => formatCurrency(value, currency)}
                colors={["rose", "amber", "blue", "indigo", "purple"]}
            />
        </Card>
    );
}

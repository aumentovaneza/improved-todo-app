import { AreaChart, Card, Title } from "@tremor/react";

const formatCurrency = (value, currency = "PHP") =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(value ?? 0);

export default function IncomeExpenseChart({ data = [], currency = "PHP" }) {
    return (
        <Card>
            <Title>Income vs Expenses</Title>
            <AreaChart
                className="mt-4 h-64"
                data={data}
                index="period"
                categories={["income", "expense"]}
                colors={["emerald", "rose"]}
                valueFormatter={(value) => formatCurrency(value, currency)}
                showLegend
            />
        </Card>
    );
}

const formatCurrency = (value, currency = "PHP") =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(value ?? 0);

export default function SummaryCards({ summary, currency = "PHP" }) {
    const cards = [
        {
            label: "Income",
            value: formatCurrency(summary?.income, currency),
            accent: "text-emerald-600",
        },
        {
            label: "Expenses",
            value: formatCurrency(summary?.expenses, currency),
            accent: "text-rose-600",
        },
        {
            label: "Savings",
            value: formatCurrency(summary?.savings, currency),
            accent: "text-violet-600",
        },
        {
            label: "Net",
            value: formatCurrency(summary?.net, currency),
            accent: "text-slate-700 dark:text-slate-200",
        },
        {
            label: "Total loans",
            value: formatCurrency(summary?.loans, currency),
            accent: "text-amber-600",
        },
    ];

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {cards.map((card) => (
                <div
                    key={card.label}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                >
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {card.label}
                    </p>
                    <p className={`mt-2 text-2xl font-semibold ${card.accent}`}>
                        {card.value}
                    </p>
                </div>
            ))}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Budget usage
                </p>
                <p className="mt-2 text-2xl font-semibold text-indigo-600">
                    {summary?.budget_utilization ?? 0}%
                </p>
            </div>
        </div>
    );
}

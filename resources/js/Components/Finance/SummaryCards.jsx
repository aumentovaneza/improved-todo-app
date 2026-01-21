const formatCurrency = (value, currency = "PHP") =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(value ?? 0);

export default function SummaryCards({
    summary,
    currency = "PHP",
    onIncomeClick,
    onUnallocatedClick,
    onExpensesClick,
    onSavingsClick,
    onNetClick,
    onLoansClick,
    onAvailableCreditClick,
}) {
    const cards = [
        {
            label: "Income",
            value: formatCurrency(summary?.income, currency),
            accent: "text-emerald-600",
            onClick: onIncomeClick,
        },
        {
            label: "Unassigned funds",
            value: formatCurrency(summary?.unallocated, currency),
            accent: "text-sky-600",
            onClick: onUnallocatedClick,
        },
        {
            label: "Available credit",
            value: formatCurrency(summary?.available_credit, currency),
            accent: "text-amber-600",
            onClick: onAvailableCreditClick,
        },
        {
            label: "Spending",
            value: formatCurrency(summary?.expenses, currency),
            accent: "text-rose-600",
            onClick: onExpensesClick,
        },
        {
            label: "Savings",
            value: formatCurrency(summary?.savings, currency),
            accent: "text-violet-600",
            onClick: onSavingsClick,
        },
        {
            label: "Net balance",
            value: formatCurrency(summary?.net, currency),
            accent: "text-slate-700 dark:text-slate-200",
            onClick: onNetClick,
        },
        {
            label: "Total loans",
            value: formatCurrency(summary?.loans, currency),
            accent: "text-amber-600",
            onClick: onLoansClick,
        },
    ];

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-7">
            {cards.map((card) => (
                <button
                    key={card.label}
                    type="button"
                    onClick={card.onClick}
                    disabled={!card.onClick}
                    className="card-hover p-4 text-left"
                >
                    <p className="text-sm text-light-muted dark:text-dark-muted">
                        {card.label}
                    </p>
                    <p className={`mt-2 text-xl font-semibold ${card.accent}`}>
                        {card.value}
                    </p>
                </button>
            ))}
        </div>
    );
}

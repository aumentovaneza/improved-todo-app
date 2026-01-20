import TodoLayout from "@/Layouts/TodoLayout";
import { Head, router } from "@inertiajs/react";
import { useMemo, useState } from "react";

const formatCurrency = (amount, currency = "PHP") =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
    }).format(amount ?? 0);

const formatDateLabel = (dateKey) => {
    const [year, month, day] = dateKey.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

const getDateKey = (dateValue) => {
    const date = new Date(dateValue);
    return (
        date.getFullYear() +
        "-" +
        String(date.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(date.getDate()).padStart(2, "0")
    );
};

const typeStyles = {
    income: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
    expense: "bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400",
    savings: "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
};
const typeOrder = ["income", "expense", "savings"];

export default function Transactions({
    transactions = [],
    filters = {},
    walletUserId,
}) {
    const [search, setSearch] = useState(filters.search ?? "");
    const [type, setType] = useState(filters.type ?? "");
    const [startDate, setStartDate] = useState(filters.start_date ?? "");
    const [endDate, setEndDate] = useState(filters.end_date ?? "");
    const [sort, setSort] = useState(filters.sort ?? "date_desc");

    const groupedTransactions = useMemo(() => {
        const grouped = {};
        transactions.forEach((transaction) => {
            const dateKey = getDateKey(transaction.occurred_at);
            if (!grouped[dateKey]) {
                grouped[dateKey] = {};
            }
            if (!grouped[dateKey][transaction.type]) {
                grouped[dateKey][transaction.type] = [];
            }
            grouped[dateKey][transaction.type].push(transaction);
        });
        return grouped;
    }, [transactions]);

    const sortedDateKeys = useMemo(() => {
        const keys = Object.keys(groupedTransactions);
        if (sort === "date_asc") {
            return keys.sort();
        }
        return keys.sort().reverse();
    }, [groupedTransactions, sort]);

    const handleSubmit = (event) => {
        event.preventDefault();
        router.get(
            route("weviewallet.transactions.index"),
            {
                search: search || undefined,
                type: type || undefined,
                start_date: startDate || undefined,
                end_date: endDate || undefined,
                sort: sort || undefined,
                wallet_user_id: walletUserId || undefined,
            },
            { preserveState: true, replace: true, preserveScroll: true }
        );
    };

    const handleReset = () => {
        setSearch("");
        setType("");
        setStartDate("");
        setEndDate("");
        setSort("date_desc");
        router.get(route("weviewallet.transactions.index"), {
            wallet_user_id: walletUserId || undefined,
        });
    };

    return (
        <TodoLayout header="All Transactions">
            <Head title="All Transactions" />
            <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                                All transactions
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Search, filter, and sort by date, type, or tags.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() =>
                                router.get(route("weviewallet.dashboard"), {
                                    wallet_user_id: walletUserId || undefined,
                                })
                            }
                            className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            Back to dashboard
                        </button>
                    </div>
                    <form
                        onSubmit={handleSubmit}
                        className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4"
                    >
                        <div className="lg:col-span-2">
                            <label className="text-xs font-semibold uppercase text-slate-400">
                                Search
                            </label>
                            <input
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                                placeholder="Search description, notes, category, or tags"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase text-slate-400">
                                Type
                            </label>
                            <select
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                                value={type}
                                onChange={(event) =>
                                    setType(event.target.value)
                                }
                            >
                                <option value="">All types</option>
                                <option value="income">Income</option>
                                <option value="expense">Expense</option>
                                <option value="savings">Savings</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase text-slate-400">
                                Sort
                            </label>
                            <select
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                                value={sort}
                                onChange={(event) =>
                                    setSort(event.target.value)
                                }
                            >
                                <option value="date_desc">
                                    Date (newest first)
                                </option>
                                <option value="date_asc">
                                    Date (oldest first)
                                </option>
                                <option value="amount_desc">
                                    Amount (high to low)
                                </option>
                                <option value="amount_asc">
                                    Amount (low to high)
                                </option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase text-slate-400">
                                Date from
                            </label>
                            <input
                                type="date"
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                                value={startDate}
                                onChange={(event) =>
                                    setStartDate(event.target.value)
                                }
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase text-slate-400">
                                Date to
                            </label>
                            <input
                                type="date"
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                                value={endDate}
                                onChange={(event) =>
                                    setEndDate(event.target.value)
                                }
                            />
                        </div>
                        <div className="flex items-end gap-2">
                            <button
                                type="submit"
                                className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500"
                            >
                                Apply filters
                            </button>
                        </div>
                        <div className="flex items-end">
                            <button
                                type="button"
                                onClick={handleReset}
                                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                Reset
                            </button>
                        </div>
                    </form>
                </div>

                {transactions.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                        No transactions match the current filters.
                    </div>
                ) : (
                    <div className="space-y-6">
                        {sortedDateKeys.map((dateKey) => (
                                <div
                                    key={dateKey}
                                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                                >
                                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                        {formatDateLabel(dateKey)}
                                    </h3>
                                    <div className="mt-4 space-y-4">
                                        {Object.keys(groupedTransactions[dateKey])
                                            .sort(
                                                (a, b) =>
                                                    typeOrder.indexOf(a) -
                                                    typeOrder.indexOf(b)
                                            )
                                            .map((transactionType) => (
                                                <div key={transactionType}>
                                                    <div className="mb-2 flex items-center gap-2">
                                                        <span
                                                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${typeStyles[transactionType]}`}
                                                        >
                                                            {transactionType}
                                                        </span>
                                                        <span className="text-xs text-slate-400">
                                                            {
                                                                groupedTransactions[
                                                                    dateKey
                                                                ][transactionType]
                                                                    .length
                                                            }{" "}
                                                            transactions
                                                        </span>
                                                    </div>
                                                    <div className="space-y-3">
                                                        {groupedTransactions[
                                                            dateKey
                                                        ][transactionType].map(
                                                            (transaction) => (
                                                                <div
                                                                    key={
                                                                        transaction.id
                                                                    }
                                                                    className="rounded-lg border border-slate-200 p-3 dark:border-slate-700"
                                                                >
                                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                                        <div>
                                                                            <p className="font-medium text-slate-900 dark:text-slate-100">
                                                                                {
                                                                                    transaction.description
                                                                                }
                                                                            </p>
                                                                            <p className="text-xs text-slate-400">
                                                                                {transaction.category
                                                                                    ?.name ??
                                                                                    "Uncategorized"}
                                                                            </p>
                                                                            {transaction.created_by &&
                                                                                transaction
                                                                                    .created_by
                                                                                    .id !==
                                                                                    transaction.user_id && (
                                                                                    <p className="text-xs text-slate-400">
                                                                                        Added by{" "}
                                                                                        {
                                                                                            transaction
                                                                                                .created_by
                                                                                                .name
                                                                                        }
                                                                                    </p>
                                                                                )}
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                                                {formatCurrency(
                                                                                    transaction.amount,
                                                                                    transaction.currency ??
                                                                                        "PHP"
                                                                                )}
                                                                            </p>
                                                                            <p className="text-xs text-slate-400">
                                                                                {transaction.payment_method ??
                                                                                    "—"}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    {transaction.tags &&
                                                                        transaction
                                                                            .tags
                                                                            .length >
                                                                            0 && (
                                                                            <div className="mt-2 flex flex-wrap gap-2">
                                                                                {transaction.tags.map(
                                                                                    (tag) => (
                                                                                        <span
                                                                                            key={
                                                                                                tag.id
                                                                                            }
                                                                                            className="rounded-full px-2 py-1 text-xs text-white"
                                                                                            style={{
                                                                                                backgroundColor:
                                                                                                    tag.color ??
                                                                                                    "#6B7280",
                                                                                            }}
                                                                                        >
                                                                                            {
                                                                                                tag.name
                                                                                            }
                                                                                        </span>
                                                                                    )
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </TodoLayout>
    );
}

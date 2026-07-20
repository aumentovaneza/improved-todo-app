import TodoLayout from "@/Layouts/TodoLayout";
import OnboardingTour from "@/Components/OnboardingTour";
import TransactionForm from "@/Components/Finance/Transactions/TransactionForm";
import Badge from "@/Components/Finance/UI/Badge";
import EmptyState from "@/Components/Finance/UI/EmptyState";
import useWalletMutation from "@/Hooks/useWalletMutation";
import { formatCurrency } from "@/Utils/currency";
import { TRANSACTION_LABEL, TRANSACTION_TONE } from "@/Utils/finance";
import { walletTransactionsSteps } from "@/tours";
import { Head, router } from "@inertiajs/react";
import { Receipt } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

const typeOrder = ["income", "loan", "expense", "savings", "transfer"];

export default function Transactions({
    transactions = [],
    totalAmount: totalAmountProp,
    page: initialPage = 1,
    hasMore: initialHasMore = false,
    perPageDates = 3,
    filters = {},
    walletUserId,
    categories = [],
    savingsGoals = [],
    loans = [],
    budgets = [],
    accounts = [],
}) {
    const mutate = useWalletMutation(walletUserId);
    const [search, setSearch] = useState(filters.search ?? "");
    const [type, setType] = useState(filters.type ?? "");
    const [startDate, setStartDate] = useState(filters.start_date ?? "");
    const [endDate, setEndDate] = useState(filters.end_date ?? "");
    const [sort, setSort] = useState(filters.sort ?? "date_desc");
    const [loadedTransactions, setLoadedTransactions] = useState(transactions);
    const [page, setPage] = useState(initialPage);
    const [hasMore, setHasMore] = useState(initialHasMore);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const loadMoreRef = useRef(null);

    useEffect(() => {
        setLoadedTransactions(transactions);
        setPage(initialPage);
        setHasMore(initialHasMore);
    }, [transactions, initialPage, initialHasMore]);

    const totalAmount = useMemo(
        () =>
            totalAmountProp ??
            loadedTransactions.reduce(
                (sum, transaction) => sum + Number(transaction.amount ?? 0),
                0
            ),
        [loadedTransactions, totalAmountProp]
    );

    const groupedTransactions = useMemo(() => {
        const grouped = {};
        loadedTransactions.forEach((transaction) => {
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
    }, [loadedTransactions]);

    const sortedDateKeys = useMemo(() => {
        const keys = Object.keys(groupedTransactions);
        if (sort === "date_asc") {
            return keys.sort();
        }
        return keys.sort().reverse();
    }, [groupedTransactions, sort]);

    const loadMore = async () => {
        if (isLoadingMore || !hasMore) {
            return;
        }
        setIsLoadingMore(true);
        try {
            const response = await window.axios.get(
                route("weviewallet.api.transactions.grouped"),
                {
                    params: {
                        page: page + 1,
                        per_page_dates: perPageDates,
                        search: search || undefined,
                        type: type || undefined,
                        start_date: startDate || undefined,
                        end_date: endDate || undefined,
                        sort: sort || undefined,
                        wallet_user_id: walletUserId || undefined,
                    },
                }
            );
            const payload = response.data ?? {};
            setLoadedTransactions((prev) => [
                ...prev,
                ...(payload.transactions ?? []),
            ]);
            setPage(payload.page ?? page + 1);
            setHasMore(Boolean(payload.has_more));
        } finally {
            setIsLoadingMore(false);
        }
    };

    useEffect(() => {
        if (!hasMore) {
            return;
        }
        const target = loadMoreRef.current;
        if (!target) {
            return;
        }
        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (entry.isIntersecting) {
                    loadMore();
                }
            },
            { rootMargin: "200px" }
        );
        observer.observe(target);
        return () => observer.disconnect();
    }, [hasMore, loadMoreRef, loadMore, isLoadingMore]);

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

    const handleCreateTransaction = useCallback(
        async (formData) => {
            const loanSelected = Boolean(formData.finance_loan_id);
            const transferDestination =
                formData.transfer_destination ||
                (formData.finance_transfer_account_id ? "internal" : "external");
            const payload = {
                ...formData,
                wallet_user_id: walletUserId || undefined,
                amount: formData.amount ? Number(formData.amount) : 0,
                finance_category_id: formData.finance_category_id || null,
                finance_loan_id: formData.finance_loan_id || null,
                finance_savings_goal_id: formData.finance_savings_goal_id || null,
                finance_account_id: formData.finance_account_id || null,
                finance_transfer_account_id:
                    transferDestination === "internal"
                        ? formData.finance_transfer_account_id || null
                        : null,
                transfer_destination: transferDestination,
                external_account_name:
                    transferDestination === "external"
                        ? formData.external_account_name || null
                        : null,
                finance_credit_card_account_id:
                    formData.finance_credit_card_account_id || null,
                finance_budget_id: loanSelected
                    ? null
                    : formData.finance_budget_id || null,
            };

            const result = await mutate({
                request: () =>
                    window.axios.post(
                        route("weviewallet.api.transactions.store"),
                        payload
                    ),
                only: ["transactions", "totalAmount", "page", "hasMore"],
                successMessage: "Transaction saved.",
            });
            return result !== false;
        },
        [mutate, walletUserId]
    );

    return (
        <TodoLayout header="All Transactions">
            <Head title="All Transactions" />
            <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                <div className="card p-4" data-tour="transactions-filters">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-semibold text-light-primary dark:text-dark-primary">
                                All transactions
                            </h2>
                            <p className="text-sm text-light-muted dark:text-dark-muted">
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
                            className="rounded-xl border border-light-border/70 px-3 py-2 text-sm font-semibold text-light-secondary hover:bg-light-hover dark:border-dark-border/70 dark:text-dark-secondary dark:hover:bg-dark-hover"
                        >
                            Back to dashboard
                        </button>
                    </div>
                    {type && (
                        <div className="mt-3 rounded-lg border border-light-border/70 bg-light-hover px-3 py-2 text-sm text-light-secondary dark:border-dark-border/70 dark:bg-dark-card/70 dark:text-dark-secondary">
                            Total {type} transactions:{" "}
                            <span className="font-semibold">
                                {formatCurrency(totalAmount)}
                            </span>
                        </div>
                    )}
                    <form
                        onSubmit={handleSubmit}
                        className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4"
                    >
                        <div className="lg:col-span-2">
                            <label className="text-xs font-semibold uppercase text-light-muted dark:text-dark-muted">
                                Search
                            </label>
                            <input
                                className="mt-1 w-full rounded-md border border-light-border/70 px-3 py-2 text-sm text-light-primary focus:border-wevie-teal focus:outline-none focus:ring-1 focus:ring-wevie-teal/30 dark:border-dark-border/70 dark:bg-dark-card dark:text-dark-primary dark:placeholder:text-dark-muted"
                                placeholder="Search description, notes, category, or tags"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase text-light-muted dark:text-dark-muted">
                                Type
                            </label>
                            <select
                                className="mt-1 w-full rounded-md border border-light-border/70 px-3 py-2 text-sm text-light-primary focus:border-wevie-teal focus:outline-none focus:ring-1 focus:ring-wevie-teal/30 dark:border-dark-border/70 dark:bg-dark-card dark:text-dark-primary"
                                value={type}
                                onChange={(event) =>
                                    setType(event.target.value)
                                }
                            >
                                <option value="">All types</option>
                                <option value="income">Income</option>
                                <option value="loan">Loan</option>
                                <option value="expense">Expense</option>
                                <option value="savings">Savings</option>
                                <option value="transfer">Transfer</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase text-light-muted dark:text-dark-muted">
                                Sort
                            </label>
                            <select
                                className="mt-1 w-full rounded-md border border-light-border/70 px-3 py-2 text-sm text-light-primary focus:border-wevie-teal focus:outline-none focus:ring-1 focus:ring-wevie-teal/30 dark:border-dark-border/70 dark:bg-dark-card dark:text-dark-primary"
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
                            <label className="text-xs font-semibold uppercase text-light-muted dark:text-dark-muted">
                                Date from
                            </label>
                            <input
                                type="date"
                                className="mt-1 w-full rounded-md border border-light-border/70 px-3 py-2 text-sm text-light-primary focus:border-wevie-teal focus:outline-none focus:ring-1 focus:ring-wevie-teal/30 dark:border-dark-border/70 dark:bg-dark-card dark:text-dark-primary"
                                value={startDate}
                                onChange={(event) =>
                                    setStartDate(event.target.value)
                                }
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase text-light-muted dark:text-dark-muted">
                                Date to
                            </label>
                            <input
                                type="date"
                                className="mt-1 w-full rounded-md border border-light-border/70 px-3 py-2 text-sm text-light-primary focus:border-wevie-teal focus:outline-none focus:ring-1 focus:ring-wevie-teal/30 dark:border-dark-border/70 dark:bg-dark-card dark:text-dark-primary"
                                value={endDate}
                                onChange={(event) =>
                                    setEndDate(event.target.value)
                                }
                            />
                        </div>
                        <div className="flex items-end gap-2">
                            <button
                                type="submit"
                                className="w-full rounded-xl bg-gradient-to-r from-wevie-teal to-wevie-mint px-3 py-2 text-sm font-medium text-white shadow-soft hover:opacity-90"
                            >
                                Apply filters
                            </button>
                        </div>
                        <div className="flex items-end">
                            <button
                                type="button"
                                onClick={handleReset}
                                className="w-full rounded-xl border border-light-border/70 px-3 py-2 text-sm font-semibold text-light-secondary hover:bg-light-hover dark:border-dark-border/70 dark:text-dark-secondary dark:hover:bg-dark-hover"
                            >
                                Reset
                            </button>
                        </div>
                    </form>
                </div>

                <div className="space-y-3" data-tour="transactions-form">
                    <div className="card p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-semibold text-light-primary dark:text-dark-primary">
                                    Add transaction
                                </h3>
                                <p className="text-sm text-light-muted dark:text-dark-muted">
                                    Log income, expenses, transfers, and more.
                                </p>
                            </div>
                        </div>
                    </div>
                    <TransactionForm
                        onSubmit={handleCreateTransaction}
                        categories={categories}
                        savingsGoals={savingsGoals}
                        loans={loans}
                        budgets={budgets}
                        accounts={accounts}
                        submitLabel="Add transaction"
                    />
                </div>

                {loadedTransactions.length === 0 ? (
                    <EmptyState
                        icon={Receipt}
                        title="No transactions yet"
                        description="No transactions match the current filters. Add one above or adjust your filters to see more."
                    />
                ) : (
                    <div className="space-y-6">
                        {sortedDateKeys.map((dateKey) => (
                                <div key={dateKey} className="card p-4">
                                    <h3 className="text-base font-semibold text-light-primary dark:text-dark-primary">
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
                                                        <Badge
                                                            label={
                                                                TRANSACTION_LABEL[
                                                                    transactionType
                                                                ] ??
                                                                transactionType
                                                            }
                                                            tone={
                                                                TRANSACTION_TONE[
                                                                    transactionType
                                                                ] ?? "neutral"
                                                            }
                                                        />
                                                        <span className="text-xs text-light-muted dark:text-dark-muted">
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
                                                                    className="rounded-lg border border-light-border/70 p-3 dark:border-dark-border/70"
                                                                >
                                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                                        <div>
                                                                            <p className="font-medium text-light-primary dark:text-dark-primary">
                                                                                {
                                                                                    transaction.description
                                                                                }
                                                                            </p>
                                                                            <p className="text-xs text-light-muted dark:text-dark-muted">
                                                                                {transaction.category
                                                                                    ?.name ??
                                                                                    "Uncategorized"}
                                                                            </p>
                                                                            {(transaction.account
                                                                                ?.name ||
                                                                                transaction.account
                                                                                    ?.label) && (
                                                                                <p className="text-xs text-light-muted dark:text-dark-muted">
                                                                                    {transaction.type ===
                                                                                    "transfer"
                                                                                        ? `From: ${transaction.account.label ?? transaction.account.name}`
                                                                                        : `Account: ${transaction.account.label ?? transaction.account.name}`}
                                                                                </p>
                                                                            )}
                                                                            {transaction.type ===
                                                                                "transfer" &&
                                                                                transaction
                                                                                    .transfer_account
                                                                                    ?.name && (
                                                                                    <p className="text-xs text-light-muted dark:text-dark-muted">
                                                                                        To:{" "}
                                                                                        {
                                                                                            transaction
                                                                                                .transfer_account
                                                                                                .label ??
                                                                                            transaction
                                                                                                .transfer_account
                                                                                                .name
                                                                                        }
                                                                                    </p>
                                                                                )}
                                                                            {transaction.type ===
                                                                                "transfer" &&
                                                                                !transaction
                                                                                    .transfer_account
                                                                                    ?.name &&
                                                                                transaction
                                                                                    .metadata
                                                                                    ?.external_account_name && (
                                                                                    <p className="text-xs text-light-muted dark:text-dark-muted">
                                                                                        To:{" "}
                                                                                        {
                                                                                            transaction
                                                                                                .metadata
                                                                                                .external_account_name
                                                                                        }
                                                                                    </p>
                                                                                )}
                                                                            {transaction.created_by &&
                                                                                transaction
                                                                                    .created_by
                                                                                    .id !==
                                                                                    transaction.user_id && (
                                                                                    <p className="text-xs text-light-muted dark:text-dark-muted">
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
                                                                            <p className="text-sm font-semibold text-light-primary dark:text-dark-primary">
                                                                                {formatCurrency(
                                                                                    transaction.amount,
                                                                                    transaction.currency ??
                                                                                        "PHP"
                                                                                )}
                                                                            </p>
                                                                            <p className="text-xs text-light-muted dark:text-dark-muted">
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
                        {loadedTransactions.length > 0 && (
                            <div
                                ref={loadMoreRef}
                                className="py-4 text-center text-sm text-light-muted dark:text-dark-muted"
                            >
                                {isLoadingMore
                                    ? "Loading more transactions..."
                                    : hasMore
                                      ? "Scroll to load more"
                                      : "No more transactions to load"}
                            </div>
                        )}
                    </div>
                )}
            </div>
            <OnboardingTour
                tourKey="wallet_transactions"
                steps={walletTransactionsSteps}
                requireCompleted={["onboarding"]}
            />
        </TodoLayout>
    );
}

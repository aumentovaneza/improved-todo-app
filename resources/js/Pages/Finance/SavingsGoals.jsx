import SavingsGoalForm from "@/Components/Finance/SavingsGoals/SavingsGoalForm";
import Modal from "@/Components/Modal";
import TodoLayout from "@/Layouts/TodoLayout";
import { Head, Link, router } from "@inertiajs/react";
import { Eye, Pencil, Repeat2, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const formatCurrency = (value, currency = "PHP") =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(value ?? 0);

const formatDate = (value) =>
    value ? new Date(value).toLocaleDateString() : "-";

export default function SavingsGoals({
    savingsGoals = [],
    accounts = [],
    walletUserId,
    filters = {},
}) {
    const [activeGoal, setActiveGoal] = useState(null);
    const [search, setSearch] = useState(filters.search ?? "");
    const [status, setStatus] = useState(filters.status ?? "all");
    const [viewGoal, setViewGoal] = useState(null);
    const [relatedTransactions, setRelatedTransactions] = useState([]);
    const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
    const [page, setPage] = useState(1);
    const perPage = 8;
    const refreshPage = useCallback(() => {
        window.location.reload();
    }, []);

    const totalPages = useMemo(
        () => Math.max(1, Math.ceil(savingsGoals.length / perPage)),
        [perPage, savingsGoals.length]
    );
    const pagedGoals = useMemo(() => {
        const start = (page - 1) * perPage;
        return savingsGoals.slice(start, start + perPage);
    }, [page, perPage, savingsGoals]);

    useEffect(() => {
        setPage(1);
    }, [search, status, savingsGoals.length]);

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages);
        }
    }, [page, totalPages]);

    const handleFilterSubmit = (event) => {
        event.preventDefault();
        router.get(
            route("weviewallet.savings-goals.index"),
            {
                search: search || undefined,
                status: status || undefined,
                wallet_user_id: walletUserId || undefined,
            },
            { preserveState: true, replace: true, preserveScroll: true }
        );
    };

    const handleResetFilters = () => {
        setSearch("");
        setStatus("all");
        router.get(route("weviewallet.savings-goals.index"), {
            wallet_user_id: walletUserId || undefined,
        });
    };

    const handleViewTransactions = useCallback(
        async (goal) => {
            setViewGoal(goal);
            setIsLoadingTransactions(true);
            try {
                const response = await window.axios.get(
                    route("weviewallet.api.transactions.related"),
                    {
                        params: {
                            wallet_user_id: walletUserId || undefined,
                            finance_savings_goal_id: goal.id,
                        },
                    }
                );
                setRelatedTransactions(response.data ?? []);
            } finally {
                setIsLoadingTransactions(false);
            }
        },
        [walletUserId]
    );

    const handleCreate = useCallback(
        async (formData) => {
            const payload = {
                ...formData,
                wallet_user_id: walletUserId || undefined,
                finance_account_id: formData.finance_account_id || null,
                target_amount: formData.target_amount
                    ? Number(formData.target_amount)
                    : 0,
                current_amount: formData.current_amount
                    ? Number(formData.current_amount)
                    : 0,
            };

            await window.axios.post(
                route("weviewallet.api.savings-goals.store"),
                payload
            );
            refreshPage();
            return true;
        },
        [refreshPage, walletUserId]
    );

    const handleDelete = useCallback(
        async (goal) => {
            await window.axios.delete(
                `${route("weviewallet.api.savings-goals.index")}/${goal.id}`
            );
            refreshPage();
        },
        [refreshPage]
    );

    const handleConvert = useCallback(
        async (goal) => {
            await window.axios.post(
                `${route("weviewallet.api.savings-goals.index")}/${goal.id}/convert`
            );
            refreshPage();
        },
        [refreshPage]
    );

    const handleEdit = useCallback(
        async (formData) => {
            if (!formData?.id) {
                return false;
            }

            const payload = {
                ...formData,
                finance_account_id: formData.finance_account_id || null,
                target_amount: formData.target_amount
                    ? Number(formData.target_amount)
                    : 0,
                current_amount: formData.current_amount
                    ? Number(formData.current_amount)
                    : 0,
            };

            await window.axios.put(
                `${route("weviewallet.api.savings-goals.index")}/${formData.id}`,
                payload
            );
            refreshPage();
            return true;
        },
        [refreshPage]
    );

    return (
        <TodoLayout header="Savings goals">
            <Head title="Savings goals" />
            <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                                Savings goals
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Track all of your savings goals in one place.
                            </p>
                        </div>
                        <Link
                            href={route("weviewallet.dashboard", {
                                wallet_user_id: walletUserId || undefined,
                            })}
                            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                            Back to dashboard
                        </Link>
                    </div>
                </div>

                <SavingsGoalForm
                    accounts={accounts}
                    onSubmit={handleCreate}
                />
                <form
                    onSubmit={handleFilterSubmit}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                >
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <label className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500">
                                Search
                            </label>
                            <input
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                                placeholder="Search goals, notes, or account"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500">
                                Status
                            </label>
                            <select
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                                value={status}
                                onChange={(event) =>
                                    setStatus(event.target.value)
                                }
                            >
                                <option value="all">All goals</option>
                                <option value="active">Active</option>
                                <option value="completed">Completed</option>
                                <option value="converted">Converted</option>
                                <option value="closed">Closed</option>
                            </select>
                        </div>
                        <div className="flex items-end gap-2 sm:col-span-2">
                            <button
                                type="submit"
                                className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500"
                            >
                                Apply filters
                            </button>
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </form>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                        All savings goals
                    </h3>
                    <div className="mt-4 overflow-x-auto">
                        <table className="min-w-full text-left text-sm text-slate-600 dark:text-slate-300">
                            <thead className="text-xs uppercase text-slate-400 dark:text-slate-500">
                                <tr>
                                    <th className="py-2">Goal</th>
                                    <th className="py-2">Account</th>
                                    <th className="py-2">Target date</th>
                                    <th className="py-2 hidden md:table-cell">
                                        Status
                                    </th>
                                    <th className="py-2 hidden md:table-cell">
                                        Progress
                                    </th>
                                    <th className="py-2 text-right">Saved</th>
                                    <th className="py-2 text-right">Target</th>
                                    <th className="py-2 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagedGoals.map((goal) => {
                                    const current = Number(
                                        goal.current_amount ?? 0
                                    );
                                    const target = Number(
                                        goal.target_amount ?? 0
                                    );
                                    const progress =
                                        target > 0
                                            ? Math.min(
                                                  100,
                                                  Math.round(
                                                      (current / target) * 100
                                                  )
                                              )
                                            : 0;
                                    const statusLabel = goal.is_active
                                        ? "Active"
                                        : goal.converted_finance_budget_id
                                          ? "Converted"
                                          : current >= target
                                            ? "Completed"
                                            : "Closed";

                                    return (
                                        <tr
                                            key={goal.id}
                                            className="border-t border-slate-200 dark:border-slate-700"
                                        >
                                            <td className="py-3">
                                                <p className="font-medium text-slate-800 dark:text-slate-100">
                                                    {goal.name}
                                                </p>
                                            </td>
                                            <td className="py-3 text-xs text-slate-400">
                                                {goal.account?.name ?? "—"}
                                            </td>
                                            <td className="py-3 text-xs text-slate-400">
                                                {formatDate(goal.target_date)}
                                            </td>
                                            <td className="py-3 hidden md:table-cell">
                                                <span
                                                    className={`text-xs font-semibold ${
                                                        statusLabel === "Active"
                                                            ? "text-emerald-600"
                                                            : statusLabel ===
                                                                "Converted"
                                                              ? "text-indigo-600"
                                                              : statusLabel ===
                                                                  "Completed"
                                                                ? "text-slate-500"
                                                                : "text-rose-500"
                                                    }`}
                                                >
                                                    {statusLabel}
                                                </span>
                                            </td>
                                            <td className="py-3 min-w-[160px] hidden md:table-cell">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-slate-400">
                                                        {progress}%
                                                    </span>
                                                    <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800">
                                                        <div
                                                            className="h-2 rounded-full bg-emerald-500"
                                                            style={{
                                                                width: `${progress}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 text-right font-semibold text-slate-800 dark:text-slate-100">
                                                {formatCurrency(
                                                    current,
                                                    goal.currency
                                                )}
                                            </td>
                                            <td className="py-3 text-right text-xs text-slate-400">
                                                {formatCurrency(
                                                    target,
                                                    goal.currency
                                                )}
                                            </td>
                                            <td className="py-3 text-right">
                                                <div className="flex flex-wrap items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setActiveGoal(goal)
                                                        }
                                                        className="rounded-md p-1 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-300"
                                                        title="Edit goal"
                                                        aria-label="Edit goal"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleViewTransactions(
                                                                goal
                                                            )
                                                        }
                                                        className="rounded-md p-1 text-slate-600 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                                                        title="View transactions"
                                                        aria-label="View transactions"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    {!goal.converted_finance_budget_id && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleConvert(
                                                                    goal
                                                                )
                                                            }
                                                            className="rounded-md p-1 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-300"
                                                            title="Convert to budget"
                                                            aria-label="Convert to budget"
                                                        >
                                                            <Repeat2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDelete(goal)
                                                        }
                                                        className="rounded-md p-1 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-900/20 dark:hover:text-rose-300"
                                                        title="Delete goal"
                                                        aria-label="Delete goal"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {(!pagedGoals || pagedGoals.length === 0) && (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="py-6 text-center text-sm text-slate-400 dark:text-slate-500"
                                        >
                                            No savings goals match your filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                {savingsGoals.length > perPage && (
                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600 dark:text-slate-300">
                        <span>
                            Showing {(page - 1) * perPage + 1}-
                            {Math.min(page * perPage, savingsGoals.length)} of{" "}
                            {savingsGoals.length}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setPage((prev) => Math.max(1, prev - 1))
                                }
                                disabled={page === 1}
                                className="rounded-md border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-700 disabled:cursor-not-allowed disabled:text-slate-300 dark:border-slate-700 dark:text-slate-300 dark:hover:text-slate-100"
                            >
                                Prev
                            </button>
                            <span className="text-xs text-slate-400">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                type="button"
                                onClick={() =>
                                    setPage((prev) =>
                                        Math.min(totalPages, prev + 1)
                                    )
                                }
                                disabled={page === totalPages}
                                className="rounded-md border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-700 disabled:cursor-not-allowed disabled:text-slate-300 dark:border-slate-700 dark:text-slate-300 dark:hover:text-slate-100"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <Modal
                show={Boolean(activeGoal)}
                onClose={() => setActiveGoal(null)}
                maxWidth="lg"
            >
                <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                        Edit savings goal
                    </h3>
                </div>
                <div className="px-6 py-4">
                    <SavingsGoalForm
                        initialValues={activeGoal}
                        accounts={accounts}
                        submitLabel="Update goal"
                        onSubmit={(payload) =>
                            Promise.resolve(handleEdit(payload)).finally(() =>
                                setActiveGoal(null)
                            )
                        }
                    />
                </div>
            </Modal>
            <Modal
                show={Boolean(viewGoal)}
                onClose={() => {
                    setViewGoal(null);
                    setRelatedTransactions([]);
                }}
                maxWidth="2xl"
            >
                <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                        {viewGoal?.name} transactions
                    </h3>
                </div>
                <div className="px-6 py-4">
                    {isLoadingTransactions ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Loading transactions...
                        </p>
                    ) : relatedTransactions.length === 0 ? (
                        <p className="text-sm text-slate-400 dark:text-slate-500">
                            No transactions linked to this goal yet.
                        </p>
                    ) : (
                        <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                            {relatedTransactions.map((transaction) => (
                                <div
                                    key={transaction.id}
                                    className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="font-medium text-slate-800 dark:text-slate-100">
                                                {transaction.description}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {transaction.category?.name ??
                                                    "Uncategorized"}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">
                                                {new Intl.NumberFormat("en-PH", {
                                                    style: "currency",
                                                    currency:
                                                        transaction.currency ??
                                                        "PHP",
                                                    maximumFractionDigits: 2,
                                                }).format(transaction.amount ?? 0)}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {transaction.occurred_at
                                                    ? new Date(
                                                          transaction.occurred_at
                                                      ).toLocaleDateString()
                                                    : "-"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Modal>
        </TodoLayout>
    );
}

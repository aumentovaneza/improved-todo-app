import BudgetForm from "@/Components/Finance/Budgets/BudgetForm";
import Modal from "@/Components/Modal";
import TodoLayout from "@/Layouts/TodoLayout";
import { Head, Link, router } from "@inertiajs/react";
import { Eye, Lock, Pencil, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const formatCurrency = (value, currency = "PHP") =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(value ?? 0);

export default function Budgets({
    budgets = [],
    categories = [],
    accounts = [],
    savingsGoals = [],
    walletUserId,
    filters = {},
}) {
    const [activeBudget, setActiveBudget] = useState(null);
    const [closingBudget, setClosingBudget] = useState(null);
    const [deletingBudget, setDeletingBudget] = useState(null);
    const [closeForm, setCloseForm] = useState({
        action: "none",
        target_budget_id: "",
        target_goal_id: "",
    });
    const [deleteForm, setDeleteForm] = useState({
        action: "none",
        target_budget_id: "",
        target_goal_id: "",
        new_budget_name: "",
        new_budget_category_id: "",
        new_budget_account_id: "",
    });
    const [search, setSearch] = useState(filters.search ?? "");
    const [status, setStatus] = useState(filters.status ?? "all");
    const refreshPage = useCallback(() => {
        window.location.reload();
    }, []);
    const [viewBudget, setViewBudget] = useState(null);
    const [relatedTransactions, setRelatedTransactions] = useState([]);
    const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
    const [page, setPage] = useState(1);
    const perPage = 8;
    const visibleBudgets = useMemo(
        () => budgets.filter((budget) => !budget.deleted_at),
        [budgets]
    );
    const totalPages = useMemo(
        () => Math.max(1, Math.ceil(visibleBudgets.length / perPage)),
        [visibleBudgets.length]
    );
    const pagedBudgets = useMemo(() => {
        const start = (page - 1) * perPage;
        return visibleBudgets.slice(start, start + perPage);
    }, [page, perPage, visibleBudgets]);

    useEffect(() => {
        setPage(1);
    }, [search, status, visibleBudgets.length]);

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages);
        }
    }, [page, totalPages]);

    const handleFilterSubmit = (event) => {
        event.preventDefault();
        router.get(
            route("weviewallet.budgets.index"),
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
        router.get(route("weviewallet.budgets.index"), {
            wallet_user_id: walletUserId || undefined,
        });
    };

    const handleViewTransactions = useCallback(
        async (budget) => {
            setViewBudget(budget);
            setIsLoadingTransactions(true);
            try {
                const response = await window.axios.get(
                    route("weviewallet.api.transactions.related"),
                    {
                        params: {
                            wallet_user_id: walletUserId || undefined,
                            finance_budget_id: budget.id,
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

    const normalizeBudgetPayload = (formData) => {
        const nonRecurring = formData.is_recurring === false;
        return {
            ...formData,
            wallet_user_id: walletUserId || undefined,
            amount: formData.amount ? Number(formData.amount) : 0,
            finance_category_id: formData.finance_category_id || null,
            finance_account_id: formData.finance_account_id || null,
            budget_type: formData.budget_type || "spending",
            period: nonRecurring ? null : formData.period || null,
            starts_on: nonRecurring ? null : formData.starts_on || null,
            ends_on: nonRecurring ? null : formData.ends_on || null,
        };
    };

    const handleCreate = useCallback(
        async (formData) => {
            const payload = normalizeBudgetPayload(formData);

            await window.axios.post(
                route("weviewallet.api.budgets.store"),
                payload
            );
            refreshPage();
            return true;
        },
        [refreshPage, walletUserId]
    );

    const handleDelete = useCallback(
        async (budget) => {
            const remaining = Math.max(
                0,
                Number(budget.amount ?? 0) -
                    Number(budget.current_spent ?? 0)
            );
            if (budget.is_active && remaining > 0) {
                setDeletingBudget(budget);
                setDeleteForm({
                    action: "none",
                    target_budget_id: "",
                    target_goal_id: "",
                    new_budget_name: "",
                    new_budget_category_id: "",
                    new_budget_account_id: "",
                });
                return;
            }
            await window.axios.post(
                `${route("weviewallet.api.budgets.index")}/${budget.id}/delete`
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

            const payload = normalizeBudgetPayload(formData);

            await window.axios.put(
                `${route("weviewallet.api.budgets.index")}/${formData.id}`,
                payload
            );
            refreshPage();
            return true;
        },
        [refreshPage]
    );

    const handleOpenClose = useCallback((budget) => {
        setClosingBudget(budget);
        setCloseForm({
            action: "none",
            target_budget_id: "",
            target_goal_id: "",
        });
    }, []);

    const handleDeleteSubmit = useCallback(async () => {
        if (!deletingBudget) {
            return;
        }
        const payload = {
            action: deleteForm.action,
            target_budget_id:
                deleteForm.action === "reallocate_budget"
                    ? deleteForm.target_budget_id || null
                    : null,
            target_goal_id:
                deleteForm.action === "add_to_savings_goal"
                    ? deleteForm.target_goal_id || null
                    : null,
            new_budget_name:
                deleteForm.action === "create_budget"
                    ? deleteForm.new_budget_name || null
                    : null,
            new_budget_category_id:
                deleteForm.action === "create_budget"
                    ? deleteForm.new_budget_category_id || null
                    : null,
            new_budget_account_id:
                deleteForm.action === "create_budget"
                    ? deleteForm.new_budget_account_id || null
                    : null,
        };
        await window.axios.post(
            `${route("weviewallet.api.budgets.index")}/${deletingBudget.id}/delete`,
            payload
        );
        refreshPage();
        setDeletingBudget(null);
    }, [deleteForm, deletingBudget, refreshPage]);

    const handleCloseSubmit = useCallback(async () => {
        if (!closingBudget) {
            return;
        }
        const payload = {
            action: closeForm.action,
            target_budget_id:
                closeForm.action === "reallocate_budget"
                    ? closeForm.target_budget_id || null
                    : null,
            target_goal_id:
                closeForm.action === "add_to_savings_goal"
                    ? closeForm.target_goal_id || null
                    : null,
        };
        await window.axios.post(
            `${route("weviewallet.api.budgets.index")}/${closingBudget.id}/close`,
            payload
        );
        refreshPage();
        setClosingBudget(null);
    }, [closeForm, closingBudget, refreshPage]);

    return (
        <TodoLayout header="Budgets">
            <Head title="Budgets" />
            <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                <div className="card p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                                Budgets
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Track every budget you have set.
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

                <BudgetForm
                    categories={categories}
                    accounts={accounts}
                    onSubmit={handleCreate}
                />

                <form onSubmit={handleFilterSubmit} className="card p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <label className="text-xs font-semibold uppercase text-slate-400">
                                Search
                            </label>
                            <input
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-dark-card"
                                placeholder="Search by budget, category, or account"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase text-slate-400">
                                Status
                            </label>
                            <select
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-dark-card"
                                value={status}
                                onChange={(event) =>
                                    setStatus(event.target.value)
                                }
                            >
                                <option value="all">All budgets</option>
                                <option value="active">Active</option>
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

                <div className="card p-4">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                        All budgets
                    </h3>
                    <div className="mt-4 overflow-x-auto">
                        <table className="min-w-[980px] w-full text-left text-sm text-slate-600 dark:text-slate-300">
                            <thead className="text-xs uppercase text-slate-400 dark:text-slate-500">
                                <tr>
                                    <th className="py-2 pr-4">Budget</th>
                                    <th className="py-2 pr-4">Type</th>
                                    <th className="py-2 pr-4">Category</th>
                                    <th className="py-2 pr-4">Account</th>
                                    <th className="py-2 hidden md:table-cell">
                                        Status
                                    </th>
                                    <th className="py-2 hidden md:table-cell">
                                        Progress
                                    </th>
                                    <th className="py-2 text-right whitespace-nowrap">
                                        Amount
                                    </th>
                                    <th className="py-2 text-right whitespace-nowrap">
                                        Remaining
                                    </th>
                                    <th className="py-2 text-right whitespace-nowrap">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagedBudgets.map((budget) => {
                                    const spent = Number(budget.current_spent ?? 0);
                                    const total = Number(budget.amount ?? 0);
                                    const remaining = Math.max(0, total - spent);
                                    const progress =
                                        total > 0
                                            ? Math.min(
                                                  100,
                                                  Math.round(
                                                      (spent / total) * 100
                                                  )
                                              )
                                            : 0;
                                    const statusLabel = budget.is_active
                                        ? "Active"
                                        : remaining === 0
                                          ? "Completed"
                                          : "Closed";

                                    return (
                                        <tr
                                            key={budget.id}
                                            className="border-t border-slate-200 dark:border-slate-700"
                                        >
                                            <td className="py-3 pr-4">
                                                <p className="font-medium text-slate-800 dark:text-slate-100">
                                                    {budget.name}
                                                </p>
                                            </td>
                                            <td className="py-3 pr-4 capitalize text-xs text-slate-400">
                                                {budget.budget_type ?? "spending"}
                                            </td>
                                            <td className="py-3 pr-4 text-xs text-slate-400">
                                                {budget.category?.name ??
                                                    "All categories"}
                                            </td>
                                            <td className="py-3 pr-4 text-xs text-slate-400">
                                                {budget.account?.name ?? "—"}
                                            </td>
                                            <td className="py-3 hidden md:table-cell">
                                                <span
                                                    className={`text-xs font-semibold ${
                                                        budget.is_active
                                                            ? "text-emerald-600 dark:text-emerald-300"
                                                            : remaining === 0
                                                              ? "text-slate-500 dark:text-slate-400"
                                                              : "text-rose-500 dark:text-rose-300"
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
                                                    <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-dark-card/70">
                                                        <div
                                                            className="h-2 rounded-full bg-rose-500 dark:bg-rose-500/80"
                                                            style={{
                                                                width: `${progress}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 text-right font-semibold text-slate-800 dark:text-slate-100">
                                                {formatCurrency(
                                                    budget.amount,
                                                    budget.currency
                                                )}
                                            </td>
                                            <td className="py-3 text-right text-xs text-slate-400">
                                                {formatCurrency(
                                                    remaining,
                                                    budget.currency
                                                )}
                                            </td>
                                            <td className="py-3 text-right">
                                                <div className="flex flex-wrap items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setActiveBudget(
                                                                budget
                                                            )
                                                        }
                                                        className="rounded-md p-1 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-300"
                                                        title="Edit budget"
                                                        aria-label="Edit budget"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleViewTransactions(
                                                                budget
                                                            )
                                                        }
                                                        className="rounded-md p-1 text-slate-600 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                                                        title="View transactions"
                                                        aria-label="View transactions"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleOpenClose(
                                                                budget
                                                            )
                                                        }
                                                        disabled={
                                                            !budget.is_active
                                                        }
                                                        className="rounded-md p-1 text-amber-600 hover:bg-amber-50 hover:text-amber-700 disabled:cursor-not-allowed disabled:text-slate-300 dark:text-amber-400 dark:hover:bg-amber-900/20 dark:hover:text-amber-300 dark:disabled:text-slate-500"
                                                        title="Close budget"
                                                        aria-label="Close budget"
                                                    >
                                                        <Lock className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDelete(budget)
                                                        }
                                                        className="rounded-md p-1 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-900/20 dark:hover:text-rose-300"
                                                        title="Delete budget"
                                                        aria-label="Delete budget"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {(!pagedBudgets ||
                                    pagedBudgets.length === 0) && (
                                    <tr>
                                        <td
                                            colSpan={9}
                                            className="py-6 text-center text-sm text-slate-400 dark:text-slate-500"
                                        >
                                            No budgets match your filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {visibleBudgets.length > perPage && (
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600 dark:text-slate-300">
                            <span>
                                Showing {(page - 1) * perPage + 1}-
                                {Math.min(page * perPage, visibleBudgets.length)}{" "}
                                of {visibleBudgets.length}
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
            </div>

            <Modal
                show={Boolean(activeBudget)}
                onClose={() => setActiveBudget(null)}
                maxWidth="lg"
            >
                <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                        Edit budget
                    </h3>
                </div>
                <div className="px-6 py-4">
                    <BudgetForm
                        categories={categories}
                        accounts={accounts}
                        initialValues={activeBudget}
                        submitLabel="Update budget"
                        onSubmit={(payload) =>
                            Promise.resolve(handleEdit(payload)).finally(() =>
                                setActiveBudget(null)
                            )
                        }
                    />
                </div>
            </Modal>

            <Modal
                show={Boolean(closingBudget)}
                onClose={() => setClosingBudget(null)}
                maxWidth="lg"
            >
                <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                        Close budget
                    </h3>
                </div>
                <div className="px-6 py-4 space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        Remaining{" "}
                        <span className="font-semibold">
                            {formatCurrency(
                                Math.max(
                                    0,
                                    Number(closingBudget?.amount ?? 0) -
                                        Number(closingBudget?.current_spent ?? 0)
                                ),
                                closingBudget?.currency ?? "PHP"
                            )}
                        </span>
                        . Choose what to do with the remaining budget.
                    </p>
                    <div>
                        <label className="text-sm text-slate-500 dark:text-slate-400">
                            Action
                        </label>
                        <select
                            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                            value={closeForm.action}
                            onChange={(event) =>
                                setCloseForm((prev) => ({
                                    ...prev,
                                    action: event.target.value,
                                }))
                            }
                        >
                            <option value="none">Close without reallocating</option>
                            <option value="reallocate_budget">
                                Reallocate to another budget
                            </option>
                            <option value="add_to_savings_goal">
                                Add to a savings goal
                            </option>
                        </select>
                    </div>
                    {closeForm.action === "reallocate_budget" && (
                        <div>
                            <label className="text-sm text-slate-500 dark:text-slate-400">
                                Target budget
                            </label>
                            <select
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                                value={closeForm.target_budget_id}
                                onChange={(event) =>
                                    setCloseForm((prev) => ({
                                        ...prev,
                                        target_budget_id: event.target.value,
                                    }))
                                }
                            >
                                <option value="">Select a budget</option>
                                {visibleBudgets
                                    .filter(
                                        (budget) =>
                                            budget.id !== closingBudget?.id
                                    )
                                    .map((budget) => (
                                        <option
                                            key={budget.id}
                                            value={budget.id}
                                        >
                                            {budget.name}
                                        </option>
                                    ))}
                            </select>
                        </div>
                    )}
                    {closeForm.action === "add_to_savings_goal" && (
                        <div>
                            <label className="text-sm text-slate-500 dark:text-slate-400">
                                Target savings goal
                            </label>
                            <select
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                                value={closeForm.target_goal_id}
                                onChange={(event) =>
                                    setCloseForm((prev) => ({
                                        ...prev,
                                        target_goal_id: event.target.value,
                                    }))
                                }
                            >
                                <option value="">Select a goal</option>
                                {savingsGoals.map((goal) => (
                                    <option key={goal.id} value={goal.id}>
                                        {goal.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setClosingBudget(null)}
                            className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:text-slate-300 dark:hover:text-slate-100"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleCloseSubmit}
                            className="rounded-md bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-500"
                        >
                            Close budget
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                show={Boolean(viewBudget)}
                onClose={() => {
                    setViewBudget(null);
                    setRelatedTransactions([]);
                }}
                maxWidth="2xl"
            >
                <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                        {viewBudget?.name} transactions
                    </h3>
                </div>
                <div className="px-6 py-4">
                    {isLoadingTransactions ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Loading transactions...
                        </p>
                    ) : relatedTransactions.length === 0 ? (
                        <p className="text-sm text-slate-400 dark:text-slate-500">
                            No transactions linked to this budget yet.
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

            <Modal
                show={Boolean(deletingBudget)}
                onClose={() => setDeletingBudget(null)}
                maxWidth="lg"
            >
                <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                        Delete budget
                    </h3>
                </div>
                <div className="px-6 py-4 space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        Remaining{" "}
                        <span className="font-semibold">
                            {formatCurrency(
                                Math.max(
                                    0,
                                    Number(deletingBudget?.amount ?? 0) -
                                        Number(deletingBudget?.current_spent ?? 0)
                                ),
                                deletingBudget?.currency ?? "PHP"
                            )}
                        </span>
                        . Choose where to reallocate before deleting.
                    </p>
                    <div>
                        <label className="text-sm text-slate-500 dark:text-slate-400">
                            Action
                        </label>
                        <select
                            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                            value={deleteForm.action}
                            onChange={(event) =>
                                setDeleteForm((prev) => ({
                                    ...prev,
                                    action: event.target.value,
                                }))
                            }
                        >
                            <option value="none">Delete without reallocating</option>
                            <option value="reallocate_budget">
                                Reallocate to an existing budget
                            </option>
                            <option value="create_budget">
                                Create a new budget
                            </option>
                            <option value="add_to_savings_goal">
                                Add to a savings goal
                            </option>
                        </select>
                    </div>
                    {deleteForm.action === "reallocate_budget" && (
                        <div>
                            <label className="text-sm text-slate-500 dark:text-slate-400">
                                Target budget
                            </label>
                            <select
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                                value={deleteForm.target_budget_id}
                                onChange={(event) =>
                                    setDeleteForm((prev) => ({
                                        ...prev,
                                        target_budget_id: event.target.value,
                                    }))
                                }
                            >
                                <option value="">Select a budget</option>
                                {visibleBudgets
                                    .filter(
                                        (budget) =>
                                            budget.id !== deletingBudget?.id
                                    )
                                    .map((budget) => (
                                        <option
                                            key={budget.id}
                                            value={budget.id}
                                        >
                                            {budget.name}
                                        </option>
                                    ))}
                            </select>
                        </div>
                    )}
                    {deleteForm.action === "create_budget" && (
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm text-slate-500 dark:text-slate-400">
                                    New budget name
                                </label>
                                <input
                                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                                    value={deleteForm.new_budget_name}
                                    onChange={(event) =>
                                        setDeleteForm((prev) => ({
                                            ...prev,
                                            new_budget_name: event.target.value,
                                        }))
                                    }
                                    placeholder="New budget name"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-slate-500 dark:text-slate-400">
                                    Category (optional)
                                </label>
                                <select
                                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                                    value={deleteForm.new_budget_category_id}
                                    onChange={(event) =>
                                        setDeleteForm((prev) => ({
                                            ...prev,
                                            new_budget_category_id:
                                                event.target.value,
                                        }))
                                    }
                                >
                                    <option value="">No category</option>
                                    {categories
                                        .filter(
                                            (category) =>
                                                category.type === "expense"
                                        )
                                        .map((category) => (
                                            <option
                                                key={category.id}
                                                value={category.id}
                                            >
                                                {category.name}
                                            </option>
                                        ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm text-slate-500 dark:text-slate-400">
                                    Account (optional)
                                </label>
                                <select
                                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                                    value={deleteForm.new_budget_account_id}
                                    onChange={(event) =>
                                        setDeleteForm((prev) => ({
                                            ...prev,
                                            new_budget_account_id:
                                                event.target.value,
                                        }))
                                    }
                                >
                                    <option value="">No account</option>
                                    {accounts.map((account) => (
                                        <option
                                            key={account.id}
                                            value={account.id}
                                        >
                                            {account.label} - {account.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                    {deleteForm.action === "add_to_savings_goal" && (
                        <div>
                            <label className="text-sm text-slate-500 dark:text-slate-400">
                                Target savings goal
                            </label>
                            <select
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                                value={deleteForm.target_goal_id}
                                onChange={(event) =>
                                    setDeleteForm((prev) => ({
                                        ...prev,
                                        target_goal_id: event.target.value,
                                    }))
                                }
                            >
                                <option value="">Select a goal</option>
                                {savingsGoals.map((goal) => (
                                    <option key={goal.id} value={goal.id}>
                                        {goal.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setDeletingBudget(null)}
                            className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:text-slate-300 dark:hover:text-slate-100"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleDeleteSubmit}
                            className="rounded-md bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-500"
                        >
                            Delete budget
                        </button>
                    </div>
                </div>
            </Modal>
        </TodoLayout>
    );
}

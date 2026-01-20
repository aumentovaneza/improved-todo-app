import BudgetForm from "@/Components/Finance/Budgets/BudgetForm";
import Modal from "@/Components/Modal";
import TodoLayout from "@/Layouts/TodoLayout";
import { Head, Link, router } from "@inertiajs/react";
import { useCallback, useState } from "react";

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
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
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
                            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
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

                <form
                    onSubmit={handleFilterSubmit}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                >
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <label className="text-xs font-semibold uppercase text-slate-400">
                                Search
                            </label>
                            <input
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
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
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
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

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                        All budgets
                    </h3>
                    <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                        {budgets.map((budget) => {
                            const spent = Number(budget.current_spent ?? 0);
                            const total = Number(budget.amount ?? 0);
                            const remaining = Math.max(0, total - spent);
                            const progress =
                                total > 0
                                    ? Math.min(
                                          100,
                                          Math.round((spent / total) * 100)
                                      )
                                    : 0;

                            return (
                                <div
                                    key={budget.id}
                                    className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-slate-800 dark:text-slate-100">
                                                {budget.name}
                                            </p>
                                            {!budget.is_active && (
                                                <p className="text-xs text-rose-500">
                                                    Closed
                                                </p>
                                            )}
                                            {budget.budget_type === "saved" && (
                                                <p className="text-xs text-slate-400">
                                                    Saved budget
                                                </p>
                                            )}
                                            <p className="text-xs text-slate-400">
                                                {budget.category?.name ??
                                                    "All categories"}
                                            </p>
                                            {budget.account?.name && (
                                                <p className="text-xs text-slate-400">
                                                    Account: {budget.account.name}
                                                </p>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setActiveBudget(budget)
                                                }
                                                className="mt-2 mr-3 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleViewTransactions(
                                                        budget
                                                    )
                                                }
                                                className="mt-2 mr-3 text-xs font-semibold text-slate-600 hover:text-slate-800"
                                            >
                                                View
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleOpenClose(budget)
                                                }
                                                disabled={!budget.is_active}
                                                className="mt-2 mr-3 text-xs font-semibold text-amber-600 hover:text-amber-700 disabled:cursor-not-allowed disabled:text-slate-300"
                                            >
                                                Close
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleDelete(budget)
                                                }
                                                className="mt-2 text-xs font-semibold text-rose-600 hover:text-rose-700"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                        <div className="text-right text-sm">
                                            <p className="font-semibold text-slate-800 dark:text-slate-100">
                                                {formatCurrency(
                                                    budget.amount,
                                                    budget.currency
                                                )}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {progress}% used
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {formatCurrency(
                                                    remaining,
                                                    budget.currency
                                                )}{" "}
                                                remaining
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800">
                                            <div
                                                className="h-2 rounded-full bg-rose-500"
                                                style={{
                                                    width: `${progress}%`,
                                                }}
                                            />
                                        </div>
                                        <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                                            <span>
                                                {formatCurrency(
                                                    spent,
                                                    budget.currency
                                                )}
                                            </span>
                                            <span>
                                                {formatCurrency(
                                                    budget.amount,
                                                    budget.currency
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {(!budgets || budgets.length === 0) && (
                            <p className="text-sm text-slate-400">
                                No budgets match your filters.
                            </p>
                        )}
                    </div>
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
                        <label className="text-sm text-slate-500">
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
                            <label className="text-sm text-slate-500">
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
                                {budgets
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
                            <label className="text-sm text-slate-500">
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
                        <p className="text-sm text-slate-500">
                            Loading transactions...
                        </p>
                    ) : relatedTransactions.length === 0 ? (
                        <p className="text-sm text-slate-400">
                            No transactions linked to this budget yet.
                        </p>
                    ) : (
                        <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                            {relatedTransactions.map((transaction) => (
                                <div
                                    key={transaction.id}
                                    className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700"
                                >
                                    <div className="flex items-center justify-between">
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
                        <label className="text-sm text-slate-500">
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
                            <label className="text-sm text-slate-500">
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
                                {budgets
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
                                <label className="text-sm text-slate-500">
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
                                <label className="text-sm text-slate-500">
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
                                <label className="text-sm text-slate-500">
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
                                            {account.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                    {deleteForm.action === "add_to_savings_goal" && (
                        <div>
                            <label className="text-sm text-slate-500">
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

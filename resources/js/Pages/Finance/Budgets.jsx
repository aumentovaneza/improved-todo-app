import BudgetForm from "@/Components/Finance/Budgets/BudgetForm";
import Modal from "@/Components/Modal";
import TodoLayout from "@/Layouts/TodoLayout";
import OnboardingTour from "@/Components/OnboardingTour";
import Badge from "@/Components/Finance/UI/Badge";
import EmptyState from "@/Components/Finance/UI/EmptyState";
import useWalletMutation from "@/Hooks/useWalletMutation";
import { formatWholeCurrency, formatCurrency } from "@/Utils/currency";
import { walletBudgetsSteps } from "@/tours";
import { Head, Link, router } from "@inertiajs/react";
import { Eye, Lock, Pencil, PiggyBank, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function Budgets({
    budgets = [],
    categories = [],
    accounts = [],
    savingsGoals = [],
    walletUserId,
    filters = {},
}) {
    const mutate = useWalletMutation(walletUserId);
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

            const result = await mutate({
                request: () =>
                    window.axios.post(
                        route("weviewallet.api.budgets.store"),
                        payload
                    ),
                only: ["budgets"],
                successMessage: "Budget created.",
            });
            return result !== false;
        },
        [mutate, walletUserId]
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
            await mutate({
                request: () =>
                    window.axios.post(
                        `${route("weviewallet.api.budgets.index")}/${budget.id}/delete`
                    ),
                only: ["budgets"],
                successMessage: "Budget deleted.",
            });
        },
        [mutate]
    );

    const handleEdit = useCallback(
        async (formData) => {
            if (!formData?.id) {
                return false;
            }

            const payload = normalizeBudgetPayload(formData);

            const result = await mutate({
                request: () =>
                    window.axios.put(
                        `${route("weviewallet.api.budgets.index")}/${formData.id}`,
                        payload
                    ),
                only: ["budgets"],
                successMessage: "Budget updated.",
            });
            return result !== false;
        },
        [mutate]
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
        await mutate({
            request: () =>
                window.axios.post(
                    `${route("weviewallet.api.budgets.index")}/${deletingBudget.id}/delete`,
                    payload
                ),
            only: ["budgets"],
            successMessage: "Budget deleted.",
        });
        setDeletingBudget(null);
    }, [deleteForm, deletingBudget, mutate]);

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
        await mutate({
            request: () =>
                window.axios.post(
                    `${route("weviewallet.api.budgets.index")}/${closingBudget.id}/close`,
                    payload
                ),
            only: ["budgets"],
            successMessage: "Budget closed.",
        });
        setClosingBudget(null);
    }, [closeForm, closingBudget, mutate]);

    return (
        <TodoLayout header="Budgets">
            <Head title="Budgets" />
            <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                <div className="card p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-semibold text-light-primary dark:text-dark-primary">
                                Budgets
                            </h2>
                            <p className="text-sm text-light-muted dark:text-dark-muted">
                                Track every budget you have set.
                            </p>
                        </div>
                        <Link
                            href={route("weviewallet.dashboard", {
                                wallet_user_id: walletUserId || undefined,
                            })}
                            className="text-sm font-semibold text-wevie-teal hover:text-wevie-teal/80"
                        >
                            Back to dashboard
                        </Link>
                    </div>
                </div>

                <div data-tour="budgets-create">
                    <BudgetForm
                        categories={categories}
                        accounts={accounts}
                        onSubmit={handleCreate}
                    />
                </div>

                <form onSubmit={handleFilterSubmit} className="card p-4" data-tour="budgets-filters">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <label className="text-xs font-semibold uppercase text-light-muted dark:text-dark-muted">
                                Search
                            </label>
                            <input
                                className="mt-1 w-full rounded-md border border-light-border/70 px-3 py-2 text-sm text-light-primary focus:border-wevie-teal focus:outline-none focus:ring-1 focus:ring-wevie-teal/30 dark:border-dark-border/70 dark:bg-dark-card dark:text-dark-primary"
                                placeholder="Search by budget, category, or account"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase text-light-muted dark:text-dark-muted">
                                Status
                            </label>
                            <select
                                className="mt-1 w-full rounded-md border border-light-border/70 px-3 py-2 text-sm text-light-primary focus:border-wevie-teal focus:outline-none focus:ring-1 focus:ring-wevie-teal/30 dark:border-dark-border/70 dark:bg-dark-card dark:text-dark-primary"
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
                                className="w-full rounded-xl bg-gradient-to-r from-wevie-teal to-wevie-mint px-3 py-2 text-sm font-medium text-white shadow-soft hover:opacity-90"
                            >
                                Apply filters
                            </button>
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="w-full rounded-xl border border-light-border/70 px-3 py-2 text-sm font-semibold text-light-secondary hover:bg-light-hover dark:border-dark-border/70 dark:text-dark-secondary dark:hover:bg-dark-hover"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </form>

                <div className="card p-4" data-tour="budgets-list">
                    <h3 className="text-lg font-semibold text-light-primary dark:text-dark-primary">
                        All budgets
                    </h3>
                    <div className="mt-4 overflow-x-auto">
                        <table className="min-w-[980px] w-full text-left text-sm text-light-secondary dark:text-dark-secondary">
                            <thead className="text-xs uppercase text-light-muted dark:text-dark-muted">
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
                                    const statusTone = budget.is_active
                                        ? "success"
                                        : remaining === 0
                                          ? "neutral"
                                          : "danger";

                                    return (
                                        <tr
                                            key={budget.id}
                                            className="border-t border-light-border/70 dark:border-dark-border/70"
                                        >
                                            <td className="py-3 pr-4">
                                                <p className="font-medium text-light-primary dark:text-dark-primary">
                                                    {budget.name}
                                                </p>
                                            </td>
                                            <td className="py-3 pr-4 capitalize text-xs text-light-muted dark:text-dark-muted">
                                                {budget.budget_type ?? "spending"}
                                            </td>
                                            <td className="py-3 pr-4 text-xs text-light-muted dark:text-dark-muted">
                                                {budget.category?.name ??
                                                    "All categories"}
                                            </td>
                                            <td className="py-3 pr-4 text-xs text-light-muted dark:text-dark-muted">
                                                {budget.account?.name ?? "—"}
                                            </td>
                                            <td className="py-3 hidden md:table-cell">
                                                <Badge
                                                    label={statusLabel}
                                                    tone={statusTone}
                                                />
                                            </td>
                                            <td className="py-3 min-w-[160px] hidden md:table-cell">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-light-muted dark:text-dark-muted">
                                                        {progress}%
                                                    </span>
                                                    <div className="h-2 w-full rounded-full bg-light-hover dark:bg-dark-hover">
                                                        <div
                                                            className="h-2 rounded-full bg-rose-500 dark:bg-rose-500/80"
                                                            style={{
                                                                width: `${progress}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 text-right font-semibold text-light-primary dark:text-dark-primary">
                                                {formatWholeCurrency(
                                                    budget.amount,
                                                    budget.currency
                                                )}
                                            </td>
                                            <td className="py-3 text-right text-xs text-light-muted dark:text-dark-muted">
                                                {formatWholeCurrency(
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
                                                        className="rounded-md p-1 text-wevie-teal hover:text-wevie-teal/80 dark:text-wevie-mint"
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
                                                        className="rounded-md p-1 text-light-secondary hover:text-light-primary dark:text-dark-secondary dark:hover:text-dark-primary"
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
                                                        className="rounded-md p-1 text-amber-600 hover:text-amber-700 disabled:cursor-not-allowed disabled:text-light-muted dark:text-amber-400 dark:hover:text-amber-300 dark:disabled:text-dark-muted"
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
                                                        className="rounded-md p-1 text-rose-600 hover:text-rose-700 dark:text-rose-300"
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
                                        <td colSpan={9} className="py-6">
                                            <EmptyState
                                                icon={PiggyBank}
                                                title="No budgets yet"
                                                description="No budgets match your filters. Create one above to start tracking your spending."
                                            />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {visibleBudgets.length > perPage && (
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-light-secondary dark:text-dark-secondary">
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
                                    className="rounded-xl border border-light-border/70 px-3 py-1 text-xs font-semibold text-light-secondary hover:bg-light-hover disabled:cursor-not-allowed disabled:text-light-muted dark:border-dark-border/70 dark:text-dark-secondary dark:hover:bg-dark-hover dark:disabled:text-dark-muted"
                                >
                                    Prev
                                </button>
                                <span className="text-xs text-light-muted dark:text-dark-muted">
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
                                    className="rounded-xl border border-light-border/70 px-3 py-1 text-xs font-semibold text-light-secondary hover:bg-light-hover disabled:cursor-not-allowed disabled:text-light-muted dark:border-dark-border/70 dark:text-dark-secondary dark:hover:bg-dark-hover dark:disabled:text-dark-muted"
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
                <div className="border-b border-light-border/70 px-6 py-4 dark:border-dark-border/70">
                    <h3 className="text-lg font-semibold text-light-primary dark:text-dark-primary">
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
                <div className="border-b border-light-border/70 px-6 py-4 dark:border-dark-border/70">
                    <h3 className="text-lg font-semibold text-light-primary dark:text-dark-primary">
                        Close budget
                    </h3>
                </div>
                <div className="px-6 py-4 space-y-4">
                    <p className="text-sm text-light-secondary dark:text-dark-secondary">
                        Remaining{" "}
                        <span className="font-semibold">
                            {formatWholeCurrency(
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
                        <label className="text-sm text-light-muted dark:text-dark-muted">
                            Action
                        </label>
                        <select
                            className="mt-1 w-full rounded-md border border-light-border/70 px-3 py-2 text-sm text-light-primary focus:border-wevie-teal focus:outline-none focus:ring-1 focus:ring-wevie-teal/30 dark:border-dark-border/70 dark:bg-dark-card dark:text-dark-primary"
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
                            <label className="text-sm text-light-muted dark:text-dark-muted">
                                Target budget
                            </label>
                            <select
                                className="mt-1 w-full rounded-md border border-light-border/70 px-3 py-2 text-sm text-light-primary focus:border-wevie-teal focus:outline-none focus:ring-1 focus:ring-wevie-teal/30 dark:border-dark-border/70 dark:bg-dark-card dark:text-dark-primary"
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
                            <label className="text-sm text-light-muted dark:text-dark-muted">
                                Target savings goal
                            </label>
                            <select
                                className="mt-1 w-full rounded-md border border-light-border/70 px-3 py-2 text-sm text-light-primary focus:border-wevie-teal focus:outline-none focus:ring-1 focus:ring-wevie-teal/30 dark:border-dark-border/70 dark:bg-dark-card dark:text-dark-primary"
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
                            className="rounded-xl border border-light-border/70 px-3 py-2 text-sm font-semibold text-light-secondary hover:bg-light-hover dark:border-dark-border/70 dark:text-dark-secondary dark:hover:bg-dark-hover"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleCloseSubmit}
                            className="rounded-xl bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-500"
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
                <div className="border-b border-light-border/70 px-6 py-4 dark:border-dark-border/70">
                    <h3 className="text-lg font-semibold text-light-primary dark:text-dark-primary">
                        {viewBudget?.name} transactions
                    </h3>
                </div>
                <div className="px-6 py-4">
                    {isLoadingTransactions ? (
                        <p className="text-sm text-light-muted dark:text-dark-muted">
                            Loading transactions...
                        </p>
                    ) : relatedTransactions.length === 0 ? (
                        <EmptyState
                            icon={PiggyBank}
                            title="No linked transactions"
                            description="No transactions are linked to this budget yet."
                        />
                    ) : (
                        <div className="space-y-3 text-sm text-light-secondary dark:text-dark-secondary">
                            {relatedTransactions.map((transaction) => (
                                <div
                                    key={transaction.id}
                                    className="rounded-lg border border-light-border/70 px-3 py-2 dark:border-dark-border/70"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="font-medium text-light-primary dark:text-dark-primary">
                                                {transaction.description}
                                            </p>
                                            <p className="text-xs text-light-muted dark:text-dark-muted">
                                                {transaction.category?.name ??
                                                    "Uncategorized"}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">
                                                {formatCurrency(
                                                    transaction.amount,
                                                    transaction.currency ?? "PHP"
                                                )}
                                            </p>
                                            <p className="text-xs text-light-muted dark:text-dark-muted">
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
                <div className="border-b border-light-border/70 px-6 py-4 dark:border-dark-border/70">
                    <h3 className="text-lg font-semibold text-light-primary dark:text-dark-primary">
                        Delete budget
                    </h3>
                </div>
                <div className="px-6 py-4 space-y-4">
                    <p className="text-sm text-light-secondary dark:text-dark-secondary">
                        Remaining{" "}
                        <span className="font-semibold">
                            {formatWholeCurrency(
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
                        <label className="text-sm text-light-muted dark:text-dark-muted">
                            Action
                        </label>
                        <select
                            className="mt-1 w-full rounded-md border border-light-border/70 px-3 py-2 text-sm text-light-primary focus:border-wevie-teal focus:outline-none focus:ring-1 focus:ring-wevie-teal/30 dark:border-dark-border/70 dark:bg-dark-card dark:text-dark-primary"
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
                            <label className="text-sm text-light-muted dark:text-dark-muted">
                                Target budget
                            </label>
                            <select
                                className="mt-1 w-full rounded-md border border-light-border/70 px-3 py-2 text-sm text-light-primary focus:border-wevie-teal focus:outline-none focus:ring-1 focus:ring-wevie-teal/30 dark:border-dark-border/70 dark:bg-dark-card dark:text-dark-primary"
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
                                <label className="text-sm text-light-muted dark:text-dark-muted">
                                    New budget name
                                </label>
                                <input
                                    className="mt-1 w-full rounded-md border border-light-border/70 px-3 py-2 text-sm text-light-primary focus:border-wevie-teal focus:outline-none focus:ring-1 focus:ring-wevie-teal/30 dark:border-dark-border/70 dark:bg-dark-card dark:text-dark-primary"
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
                                <label className="text-sm text-light-muted dark:text-dark-muted">
                                    Category (optional)
                                </label>
                                <select
                                    className="mt-1 w-full rounded-md border border-light-border/70 px-3 py-2 text-sm text-light-primary focus:border-wevie-teal focus:outline-none focus:ring-1 focus:ring-wevie-teal/30 dark:border-dark-border/70 dark:bg-dark-card dark:text-dark-primary"
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
                                <label className="text-sm text-light-muted dark:text-dark-muted">
                                    Account (optional)
                                </label>
                                <select
                                    className="mt-1 w-full rounded-md border border-light-border/70 px-3 py-2 text-sm text-light-primary focus:border-wevie-teal focus:outline-none focus:ring-1 focus:ring-wevie-teal/30 dark:border-dark-border/70 dark:bg-dark-card dark:text-dark-primary"
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
                            <label className="text-sm text-light-muted dark:text-dark-muted">
                                Target savings goal
                            </label>
                            <select
                                className="mt-1 w-full rounded-md border border-light-border/70 px-3 py-2 text-sm text-light-primary focus:border-wevie-teal focus:outline-none focus:ring-1 focus:ring-wevie-teal/30 dark:border-dark-border/70 dark:bg-dark-card dark:text-dark-primary"
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
                            className="rounded-xl border border-light-border/70 px-3 py-2 text-sm font-semibold text-light-secondary hover:bg-light-hover dark:border-dark-border/70 dark:text-dark-secondary dark:hover:bg-dark-hover"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleDeleteSubmit}
                            className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-500"
                        >
                            Delete budget
                        </button>
                    </div>
                </div>
            </Modal>
            <OnboardingTour
                tourKey="wallet_budgets"
                steps={walletBudgetsSteps}
                requireCompleted={["onboarding"]}
            />
        </TodoLayout>
    );
}

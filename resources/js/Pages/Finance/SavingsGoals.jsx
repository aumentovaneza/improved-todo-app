import SavingsGoalForm from "@/Components/Finance/SavingsGoals/SavingsGoalForm";
import Modal from "@/Components/Modal";
import TodoLayout from "@/Layouts/TodoLayout";
import OnboardingTour from "@/Components/OnboardingTour";
import Badge from "@/Components/Finance/UI/Badge";
import EmptyState from "@/Components/Finance/UI/EmptyState";
import useWalletMutation from "@/Hooks/useWalletMutation";
import { formatWholeCurrency, formatCurrency } from "@/Utils/currency";
import { walletSavingsGoalsSteps } from "@/tours";
import { Head, Link, router } from "@inertiajs/react";
import { Eye, Pencil, Repeat2, Target, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const formatDate = (value) =>
    value ? new Date(value).toLocaleDateString() : "-";

const STATUS_TONE = {
    Active: "success",
    Converted: "purple",
    Completed: "neutral",
    Closed: "danger",
};

export default function SavingsGoals({
    savingsGoals = [],
    accounts = [],
    walletUserId,
    filters = {},
}) {
    const mutate = useWalletMutation(walletUserId);
    const [activeGoal, setActiveGoal] = useState(null);
    const [search, setSearch] = useState(filters.search ?? "");
    const [status, setStatus] = useState(filters.status ?? "all");
    const [viewGoal, setViewGoal] = useState(null);
    const [relatedTransactions, setRelatedTransactions] = useState([]);
    const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
    const [page, setPage] = useState(1);
    const perPage = 8;

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

            const result = await mutate({
                request: () =>
                    window.axios.post(
                        route("weviewallet.api.savings-goals.store"),
                        payload
                    ),
                only: ["savingsGoals"],
                successMessage: "Savings goal created.",
            });
            return result !== false;
        },
        [mutate, walletUserId]
    );

    const handleDelete = useCallback(
        async (goal) => {
            await mutate({
                request: () =>
                    window.axios.delete(
                        `${route("weviewallet.api.savings-goals.index")}/${goal.id}`
                    ),
                only: ["savingsGoals"],
                successMessage: "Savings goal deleted.",
            });
        },
        [mutate]
    );

    const handleConvert = useCallback(
        async (goal) => {
            await mutate({
                request: () =>
                    window.axios.post(
                        `${route("weviewallet.api.savings-goals.index")}/${goal.id}/convert`
                    ),
                only: ["savingsGoals"],
                successMessage: "Savings goal converted to a budget.",
            });
        },
        [mutate]
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

            const result = await mutate({
                request: () =>
                    window.axios.put(
                        `${route("weviewallet.api.savings-goals.index")}/${formData.id}`,
                        payload
                    ),
                only: ["savingsGoals"],
                successMessage: "Savings goal updated.",
            });
            return result !== false;
        },
        [mutate]
    );

    return (
        <TodoLayout header="Savings goals">
            <Head title="Savings goals" />
            <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                <div className="card p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-semibold text-light-primary dark:text-dark-primary">
                                Savings goals
                            </h2>
                            <p className="text-sm text-light-muted dark:text-dark-muted">
                                Track all of your savings goals in one place.
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

                <div data-tour="goals-create">
                    <SavingsGoalForm
                        accounts={accounts}
                        onSubmit={handleCreate}
                    />
                </div>
                <form onSubmit={handleFilterSubmit} className="card p-4" data-tour="goals-filters">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <label className="text-xs font-semibold uppercase text-light-muted dark:text-dark-muted">
                                Search
                            </label>
                            <input
                                className="mt-1 w-full rounded-md border border-light-border/70 px-3 py-2 text-sm text-light-primary focus:border-wevie-teal focus:outline-none focus:ring-1 focus:ring-wevie-teal/30 dark:border-dark-border/70 dark:bg-dark-card dark:text-dark-primary"
                                placeholder="Search goals, notes, or account"
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
                <div className="card p-4" data-tour="goals-list">
                    <h3 className="text-lg font-semibold text-light-primary dark:text-dark-primary">
                        All savings goals
                    </h3>
                    <div className="mt-4 overflow-x-auto">
                        <table className="min-w-[920px] w-full text-left text-sm text-light-secondary dark:text-dark-secondary">
                            <thead className="text-xs uppercase text-light-muted dark:text-dark-muted">
                                <tr>
                                    <th className="py-2 pr-4">Goal</th>
                                    <th className="py-2 pr-4">Account</th>
                                    <th className="py-2 pr-4">Target date</th>
                                    <th className="py-2 hidden md:table-cell">
                                        Status
                                    </th>
                                    <th className="py-2 hidden md:table-cell">
                                        Progress
                                    </th>
                                    <th className="py-2 text-right whitespace-nowrap">
                                        Saved
                                    </th>
                                    <th className="py-2 text-right whitespace-nowrap">
                                        Target
                                    </th>
                                    <th className="py-2 text-right whitespace-nowrap">
                                        Actions
                                    </th>
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
                                            className="border-t border-light-border/70 dark:border-dark-border/70"
                                        >
                                            <td className="py-3 pr-4">
                                                <p className="font-medium text-light-primary dark:text-dark-primary">
                                                    {goal.name}
                                                </p>
                                            </td>
                                            <td className="py-3 pr-4 text-xs text-light-muted dark:text-dark-muted">
                                                {goal.account?.name ?? "—"}
                                            </td>
                                            <td className="py-3 pr-4 text-xs text-light-muted dark:text-dark-muted">
                                                {formatDate(goal.target_date)}
                                            </td>
                                            <td className="py-3 hidden md:table-cell">
                                                <Badge
                                                    label={statusLabel}
                                                    tone={
                                                        STATUS_TONE[
                                                            statusLabel
                                                        ] ?? "neutral"
                                                    }
                                                />
                                            </td>
                                            <td className="py-3 min-w-[160px] hidden md:table-cell">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-light-muted dark:text-dark-muted">
                                                        {progress}%
                                                    </span>
                                                    <div className="h-2 w-full rounded-full bg-light-hover dark:bg-dark-hover">
                                                        <div
                                                            className="h-2 rounded-full bg-emerald-500 dark:bg-emerald-500/80"
                                                            style={{
                                                                width: `${progress}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 text-right font-semibold text-light-primary dark:text-dark-primary">
                                                {formatWholeCurrency(
                                                    current,
                                                    goal.currency
                                                )}
                                            </td>
                                            <td className="py-3 text-right text-xs text-light-muted dark:text-dark-muted">
                                                {formatWholeCurrency(
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
                                                        className="rounded-md p-1 text-wevie-teal hover:text-wevie-teal/80 dark:text-wevie-mint"
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
                                                        className="rounded-md p-1 text-light-secondary hover:text-light-primary dark:text-dark-secondary dark:hover:text-dark-primary"
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
                                                            className="rounded-md p-1 text-emerald-600 hover:text-emerald-700 dark:text-emerald-300"
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
                                                        className="rounded-md p-1 text-rose-600 hover:text-rose-700 dark:text-rose-300"
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
                                        <td colSpan={8} className="py-6">
                                            <EmptyState
                                                icon={Target}
                                                title="No savings goals yet"
                                                description="No savings goals match your filters. Create one above to start saving toward something."
                                            />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                {savingsGoals.length > perPage && (
                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-light-secondary dark:text-dark-secondary">
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

            <Modal
                show={Boolean(activeGoal)}
                onClose={() => setActiveGoal(null)}
                maxWidth="lg"
            >
                <div className="border-b border-light-border/70 px-6 py-4 dark:border-dark-border/70">
                    <h3 className="text-lg font-semibold text-light-primary dark:text-dark-primary">
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
                <div className="border-b border-light-border/70 px-6 py-4 dark:border-dark-border/70">
                    <h3 className="text-lg font-semibold text-light-primary dark:text-dark-primary">
                        {viewGoal?.name} transactions
                    </h3>
                </div>
                <div className="px-6 py-4">
                    {isLoadingTransactions ? (
                        <p className="text-sm text-light-muted dark:text-dark-muted">
                            Loading transactions...
                        </p>
                    ) : relatedTransactions.length === 0 ? (
                        <EmptyState
                            icon={Target}
                            title="No linked transactions"
                            description="No transactions are linked to this goal yet."
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
            <OnboardingTour
                tourKey="wallet_savings_goals"
                steps={walletSavingsGoalsSteps}
                requireCompleted={["onboarding"]}
            />
        </TodoLayout>
    );
}

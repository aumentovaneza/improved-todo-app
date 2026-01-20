import Dropdown from "@/Components/Dropdown";
import SummaryCards from "@/Components/Finance/SummaryCards";
import TransactionsList from "@/Components/Finance/Transactions/TransactionsList";
import TransactionForm from "@/Components/Finance/Transactions/TransactionForm";
import IncomeExpenseChart from "@/Components/Finance/Charts/IncomeExpenseChart";
import TrendsChart from "@/Components/Finance/Charts/TrendsChart";
import CategoryBreakdownChart from "@/Components/Finance/Charts/CategoryBreakdownChart";
import BudgetForm from "@/Components/Finance/Budgets/BudgetForm";
import SavingsGoalsList from "@/Components/Finance/SavingsGoals/SavingsGoalsList";
import SavingsGoalForm from "@/Components/Finance/SavingsGoals/SavingsGoalForm";
import LoansList from "@/Components/Finance/Loans/LoansList";
import LoanForm from "@/Components/Finance/Loans/LoanForm";
import Modal from "@/Components/Modal";
import { Link } from "@inertiajs/react";
import { Plus, Settings, Users, Tags } from "lucide-react";
import { useState } from "react";

const formatCurrency = (value, currency = "PHP") =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(value ?? 0);

export default function FinanceDashboard({
    summary,
    charts,
    transactions,
    categories,
    budgets,
    savingsGoals,
    loans,
    tier,
    canAccessAdvancedCharts,
    onViewAllTransactions,
    isLoadingTransactions,
    onCreateTransaction,
    onCreateBudget,
    onCreateSavingsGoal,
    onCreateLoan,
    onDeleteBudget,
    onDeleteSavingsGoal,
    onDeleteLoan,
    onDeleteTransaction,
    onEditLoan,
    onEditBudget,
    onEditSavingsGoal,
    onEditTransaction,
    onOpenCollaborators,
    walletUserId,
    isWalletOwner,
}) {
    const [activeModal, setActiveModal] = useState(null);

    const sortByUpdated = (items = []) =>
        [...items].sort(
            (a, b) =>
                new Date(b.updated_at ?? 0).getTime() -
                new Date(a.updated_at ?? 0).getTime()
        );

    const visibleBudgets = sortByUpdated(budgets).slice(0, 2);
    const visibleSavings = sortByUpdated(savingsGoals).slice(0, 2);
    const visibleLoans = sortByUpdated(loans).slice(0, 2);

    const handleSubmitAndClose = async (handler, payload) => {
        const succeeded = await Promise.resolve(handler?.(payload));
        if (succeeded !== false) {
            setActiveModal(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                            WevieWallet quick actions
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Add new items without losing your place.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                            {tier} tier
                        </div>
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button
                                    type="button"
                                    className="inline-flex items-center justify-center rounded-md border border-slate-200 p-2 text-slate-500 shadow-sm hover:text-slate-700 dark:border-slate-700 dark:text-slate-300 dark:hover:text-slate-100"
                                    title="Wallet settings"
                                >
                                    <Settings className="h-4 w-4" />
                                </button>
                            </Dropdown.Trigger>
                            <Dropdown.Content
                                align="right"
                                width="48"
                                contentClasses="py-1 bg-white dark:bg-slate-900"
                            >
                                {isWalletOwner && (
                                    <button
                                        type="button"
                                        onClick={() => onOpenCollaborators?.()}
                                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                                    >
                                        <Users className="h-4 w-4" />
                                        Collaborators
                                    </button>
                                )}
                                <Dropdown.Link
                                    href={route("profile.finance-categories", {
                                        wallet_user_id: walletUserId || undefined,
                                    })}
                                >
                                    <span className="inline-flex items-center gap-2">
                                        <Tags className="h-4 w-4" />
                                        Manage categories
                                    </span>
                                </Dropdown.Link>
                            </Dropdown.Content>
                        </Dropdown>
                    </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={() =>
                            setActiveModal({
                                mode: "create",
                                type: "transaction",
                            })
                        }
                        className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500"
                    >
                        <Plus className="h-4 w-4" />
                        Add transaction
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveModal({ type: "budget" })}
                        className="inline-flex items-center gap-2 rounded-md border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm hover:border-indigo-300 hover:bg-indigo-50 dark:border-indigo-700/60 dark:text-indigo-200 dark:hover:bg-indigo-900/30"
                    >
                        <Plus className="h-4 w-4" />
                        Add budget
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveModal({ type: "goal" })}
                        className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                        <Plus className="h-4 w-4" />
                        Add savings goal
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveModal({ type: "loan" })}
                        className="inline-flex items-center gap-2 rounded-md border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-700 shadow-sm hover:border-amber-300 hover:bg-amber-50 dark:border-amber-700/60 dark:text-amber-200 dark:hover:bg-amber-900/30"
                    >
                        <Plus className="h-4 w-4" />
                        Add loan
                    </button>
                </div>
            </div>

            <SummaryCards summary={summary} />

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <IncomeExpenseChart data={charts?.income_vs_expense} />
                </div>
                <div className="space-y-6">
                    <CategoryBreakdownChart data={charts?.category_breakdown} />
                </div>
            </div>

            {canAccessAdvancedCharts && (
                <div>
                    <TrendsChart data={charts?.trend} />
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                            Active budgets
                        </h3>
                        <Link
                            href={route("weviewallet.budgets.index")}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                        >
                            Show all
                        </Link>
                    </div>
                    <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                        {visibleBudgets.map((budget) => {
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
                                            <p className="text-xs text-slate-400">
                                                {budget.category?.name ??
                                                    "All categories"}
                                            </p>
                                            <div className="mt-2 flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setActiveModal({
                                                            mode: "edit",
                                                            type: "budget",
                                                            data: budget,
                                                        })
                                                    }
                                                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        onDeleteBudget?.(budget)
                                                    }
                                                    className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                                                >
                                                    Delete
                                                </button>
                                            </div>
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
                                                style={{ width: `${progress}%` }}
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
                        {(!visibleBudgets || visibleBudgets.length === 0) && (
                            <p className="text-sm text-slate-400">
                                No active budgets yet.
                            </p>
                        )}
                    </div>
                </div>
                <SavingsGoalsList
                    goals={visibleSavings}
                    onDelete={onDeleteSavingsGoal}
                    onEdit={(goal) =>
                        setActiveModal({
                            mode: "edit",
                            type: "goal",
                            data: goal,
                        })
                    }
                    showAllHref={route("weviewallet.savings-goals.index")}
                />
                <LoansList
                    loans={visibleLoans}
                    onDelete={onDeleteLoan}
                    onEdit={(loan) =>
                        setActiveModal({
                            mode: "edit",
                            type: "loan",
                            data: loan,
                        })
                    }
                    showAllHref={route("weviewallet.loans.index")}
                />
            </div>

            <div className="grid gap-6">
                <div>
                    <TransactionsList
                        transactions={transactions}
                        onViewAll={onViewAllTransactions}
                        isLoading={isLoadingTransactions}
                        onDelete={onDeleteTransaction}
                        onEdit={(transaction) =>
                            setActiveModal({
                                mode: "edit",
                                type: "transaction",
                                data: transaction,
                            })
                        }
                    />
                </div>
            </div>

            <Modal
                show={activeModal?.type === "transaction"}
                onClose={() => setActiveModal(null)}
                maxWidth="lg"
            >
                <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                        {activeModal?.mode === "edit"
                            ? "Edit transaction"
                            : "Add transaction"}
                    </h3>
                </div>
                <div className="px-6 py-4">
                    <TransactionForm
                        categories={categories}
                        savingsGoals={savingsGoals}
                        loans={loans}
                        budgets={budgets}
                        initialValues={activeModal?.data}
                        submitLabel={
                            activeModal?.mode === "edit"
                                ? "Update transaction"
                                : "Save transaction"
                        }
                        onSubmit={(payload) =>
                            handleSubmitAndClose(
                                activeModal?.mode === "edit"
                                    ? onEditTransaction
                                    : onCreateTransaction,
                                payload
                            )
                        }
                    />
                </div>
            </Modal>

            <Modal
                show={activeModal?.type === "budget"}
                onClose={() => setActiveModal(null)}
                maxWidth="lg"
            >
                <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                        {activeModal?.mode === "edit"
                            ? "Edit budget"
                            : "Add budget"}
                    </h3>
                </div>
                <div className="px-6 py-4">
                    <BudgetForm
                        categories={categories}
                        initialValues={activeModal?.data}
                        submitLabel={
                            activeModal?.mode === "edit"
                                ? "Update budget"
                                : "Save budget"
                        }
                        onSubmit={(payload) =>
                            handleSubmitAndClose(
                                activeModal?.mode === "edit"
                                    ? onEditBudget
                                    : onCreateBudget,
                                payload
                            )
                        }
                    />
                </div>
            </Modal>

            <Modal
                show={activeModal?.type === "goal"}
                onClose={() => setActiveModal(null)}
                maxWidth="lg"
            >
                <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                        {activeModal?.mode === "edit"
                            ? "Edit savings goal"
                            : "Add savings goal"}
                    </h3>
                </div>
                <div className="px-6 py-4">
                    <SavingsGoalForm
                        initialValues={activeModal?.data}
                        submitLabel={
                            activeModal?.mode === "edit"
                                ? "Update goal"
                                : "Save goal"
                        }
                        onSubmit={(payload) =>
                            handleSubmitAndClose(
                                activeModal?.mode === "edit"
                                    ? onEditSavingsGoal
                                    : onCreateSavingsGoal,
                                payload
                            )
                        }
                    />
                </div>
            </Modal>

            <Modal
                show={activeModal?.type === "loan"}
                onClose={() => setActiveModal(null)}
                maxWidth="lg"
            >
                <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                        {activeModal?.mode === "edit"
                            ? "Edit loan"
                            : "Add loan"}
                    </h3>
                </div>
                <div className="px-6 py-4">
                    <LoanForm
                        initialValues={activeModal?.data}
                        submitLabel={
                            activeModal?.mode === "edit"
                                ? "Update loan"
                                : "Save loan"
                        }
                        onSubmit={(payload) =>
                            handleSubmitAndClose(
                                activeModal?.mode === "edit"
                                    ? onEditLoan
                                    : onCreateLoan,
                                payload
                            )
                        }
                    />
                </div>
            </Modal>

        </div>
    );
}

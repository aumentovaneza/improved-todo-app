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
import { Landmark, Plus, Settings, Users } from "lucide-react";
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
    accounts,
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
    onConvertSavingsGoal,
    onDeleteLoan,
    onDeleteTransaction,
    onEditLoan,
    onEditBudget,
    onEditSavingsGoal,
    onEditTransaction,
    onViewLoan,
    onViewGoal,
    onViewBudget,
    onOpenCollaborators,
    onIncomeSummary,
    onUnallocatedSummary,
    onExpensesSummary,
    onSavingsSummary,
    onNetSummary,
    onLoansSummary,
    onAvailableCreditSummary,
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
    const visibleSavings = sortByUpdated(
        savingsGoals.filter((goal) => goal.is_active)
    ).slice(0, 2);
    const visibleLoans = sortByUpdated(
        loans.filter((loan) => loan.is_active)
    ).slice(0, 2);

    const handleSubmitAndClose = async (handler, payload) => {
        const succeeded = await Promise.resolve(handler?.(payload));
        if (succeeded !== false) {
            setActiveModal(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="card p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold text-light-primary dark:text-dark-primary">
                            WevieWallet
                        </h2>
                        <p className="text-sm text-light-muted dark:text-dark-muted">
                            Add updates gently, without breaking your flow.
                        </p>
                    </div>
                    <div className="flex items-center">
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button
                                    type="button"
                                    className="inline-flex items-center justify-center rounded-xl border border-light-border/70 p-2 text-light-muted shadow-sm hover:text-light-secondary dark:border-dark-border/70 dark:text-dark-muted dark:hover:text-dark-secondary"
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
                                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-light-secondary hover:bg-light-hover dark:text-dark-secondary dark:hover:bg-dark-hover"
                                    >
                                        <Users className="h-4 w-4" />
                                        Collaborators
                                    </button>
                                )}
                                <Dropdown.Link
                                    href={route("profile.weviewallet")}
                                >
                                    <span className="inline-flex items-center gap-2">
                                        <Landmark className="h-4 w-4" />
                                        WevieWallet management
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
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-wevie-teal to-wevie-mint px-4 py-2 text-sm font-medium text-white shadow-soft hover:opacity-90"
                    >
                        <Plus className="h-4 w-4" />
                        Add transaction
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveModal({ type: "budget" })}
                        className="inline-flex items-center gap-2 rounded-xl border border-light-border/70 px-4 py-2 text-sm font-medium text-light-secondary shadow-sm hover:bg-light-hover dark:border-dark-border/70 dark:text-dark-secondary dark:hover:bg-dark-hover"
                    >
                        <Plus className="h-4 w-4" />
                        Add budget
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveModal({ type: "goal" })}
                        className="inline-flex items-center gap-2 rounded-xl border border-light-border/70 px-4 py-2 text-sm font-medium text-light-secondary shadow-sm hover:bg-light-hover dark:border-dark-border/70 dark:text-dark-secondary dark:hover:bg-dark-hover"
                    >
                        <Plus className="h-4 w-4" />
                        Add savings goal
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveModal({ type: "loan" })}
                        className="inline-flex items-center gap-2 rounded-xl border border-light-border/70 px-4 py-2 text-sm font-medium text-light-secondary shadow-sm hover:bg-light-hover dark:border-dark-border/70 dark:text-dark-secondary dark:hover:bg-dark-hover"
                    >
                        <Plus className="h-4 w-4" />
                        Add loan
                    </button>
                </div>
            </div>

            <SummaryCards
                summary={summary}
                onIncomeClick={onIncomeSummary}
                onUnallocatedClick={onUnallocatedSummary}
                onAvailableCreditClick={onAvailableCreditSummary}
                onExpensesClick={onExpensesSummary}
                onSavingsClick={onSavingsSummary}
                onNetClick={onNetSummary}
                onLoansClick={onLoansSummary}
            />

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <IncomeExpenseChart data={charts?.income_vs_expense} />
                </div>
                <div className="space-y-6">
                    <CategoryBreakdownChart
                        data={charts?.category_breakdown}
                        period={summary?.period}
                    />
                </div>
            </div>

            <div>
                <TrendsChart data={charts?.trend} />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="card p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-light-primary dark:text-dark-primary">
                            Active budgets
                        </h3>
                        <Link
                            href={route("weviewallet.budgets.index")}
                            className="text-xs font-semibold text-wevie-teal hover:text-wevie-teal/80"
                        >
                            See all
                        </Link>
                    </div>
                    <div className="mt-4 space-y-3 text-sm text-light-secondary dark:text-dark-secondary">
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
                                    className="rounded-xl border border-light-border/70 px-3 py-2 dark:border-dark-border/70"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-light-primary dark:text-dark-primary">
                                                {budget.name}
                                            </p>
                                            <p className="text-xs text-light-muted dark:text-dark-muted">
                                                {budget.category?.name ??
                                                    "All categories"}
                                            </p>
                                            {budget.budget_type === "saved" && (
                                                <p className="text-xs text-light-muted dark:text-dark-muted">
                                                    Saved budget
                                                </p>
                                            )}
                                            {budget.account?.name && (
                                                <p className="text-xs text-light-muted dark:text-dark-muted">
                                                    Account: {budget.account.name}
                                                </p>
                                            )}
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
                                                    className="text-xs font-semibold text-wevie-teal hover:text-wevie-teal/80"
                                                >
                                                    Edit
                                                </button>
                                                {onViewBudget && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            onViewBudget?.(
                                                                budget
                                                            )
                                                        }
                                                        className="text-xs font-semibold text-light-secondary hover:text-light-primary dark:text-dark-secondary dark:hover:text-dark-primary"
                                                    >
                                                        View
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        onDeleteBudget?.(budget)
                                                    }
                                                    className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                        <div className="text-right text-sm">
                                            <p className="font-semibold text-light-primary dark:text-dark-primary">
                                                {formatCurrency(
                                                    budget.amount,
                                                    budget.currency
                                                )}
                                            </p>
                                            <p className="text-xs text-light-muted dark:text-dark-muted">
                                                {progress}% used
                                            </p>
                                            <p className="text-xs text-light-muted dark:text-dark-muted">
                                                {formatCurrency(
                                                    remaining,
                                                    budget.currency
                                                )}{" "}
                                                remaining
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        <div className="h-2 w-full rounded-full bg-light-hover dark:bg-dark-hover">
                                            <div
                                                className="h-2 rounded-full bg-wevie-teal/70"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                        <div className="mt-1 flex items-center justify-between text-xs text-light-muted dark:text-dark-muted">
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
                            <p className="text-sm text-light-muted dark:text-dark-muted">
                                No active budgets yet.
                            </p>
                        )}
                    </div>
                </div>
                <SavingsGoalsList
                    goals={visibleSavings}
                    onDelete={onDeleteSavingsGoal}
                    onConvert={onConvertSavingsGoal}
                    onView={onViewGoal}
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
                    onView={onViewLoan}
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
                maxWidth="2xl"
            >
                <div className="border-b border-light-border/70 px-6 py-4 dark:border-dark-border/70">
                    <h3 className="text-lg font-semibold text-light-primary dark:text-dark-primary">
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
                        accounts={accounts}
                        initialValues={activeModal?.data}
                        submitLabel={
                            activeModal?.mode === "edit"
                                ? "Save changes"
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
                <div className="border-b border-light-border/70 px-6 py-4 dark:border-dark-border/70">
                    <h3 className="text-lg font-semibold text-light-primary dark:text-dark-primary">
                        {activeModal?.mode === "edit"
                            ? "Edit budget"
                            : "Add budget"}
                    </h3>
                </div>
                <div className="px-6 py-4">
                    <BudgetForm
                        categories={categories}
                        accounts={accounts}
                        initialValues={activeModal?.data}
                        submitLabel={
                            activeModal?.mode === "edit"
                                ? "Save changes"
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
                <div className="border-b border-light-border/70 px-6 py-4 dark:border-dark-border/70">
                    <h3 className="text-lg font-semibold text-light-primary dark:text-dark-primary">
                        {activeModal?.mode === "edit"
                            ? "Edit savings goal"
                            : "Add savings goal"}
                    </h3>
                </div>
                <div className="px-6 py-4">
                    <SavingsGoalForm
                        initialValues={activeModal?.data}
                        accounts={accounts}
                        submitLabel={
                            activeModal?.mode === "edit"
                                ? "Save changes"
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
                <div className="border-b border-light-border/70 px-6 py-4 dark:border-dark-border/70">
                    <h3 className="text-lg font-semibold text-light-primary dark:text-dark-primary">
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
                                ? "Save changes"
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

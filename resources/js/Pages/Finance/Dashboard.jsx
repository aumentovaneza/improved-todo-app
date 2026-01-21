import FinanceDashboard from "@/Components/Finance/Dashboard/FinanceDashboard";
import Dropdown from "@/Components/Dropdown";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import Modal from "@/Components/Modal";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import TodoLayout from "@/Layouts/TodoLayout";
import { Head, router, useForm } from "@inertiajs/react";
import { UserPlus, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function Dashboard(props) {
    const [transactions, setTransactions] = useState(props.transactions ?? []);
    const [budgets, setBudgets] = useState(props.budgets ?? []);
    const [savingsGoals, setSavingsGoals] = useState(
        props.savingsGoals ?? []
    );
    const [loans, setLoans] = useState(props.loans ?? []);
    const accounts = props.accounts ?? [];
    const [summary, setSummary] = useState(props.summary ?? {});
    const [charts, setCharts] = useState(props.charts ?? {});
    const [categories, setCategories] = useState(props.categories ?? []);
    const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
    const [isReloading, setIsReloading] = useState(false);
    const [showCollaboratorsModal, setShowCollaboratorsModal] = useState(false);
    const [activeWalletId, setActiveWalletId] = useState(
        props.walletUserId ?? props.activeWallet?.id ?? null
    );
    const [viewEntity, setViewEntity] = useState(null);
    const [relatedTransactions, setRelatedTransactions] = useState([]);
    const [isLoadingRelated, setIsLoadingRelated] = useState(false);
    const addCollaboratorForm = useForm({ email: "", user_id: null });
    const [collaboratorQuery, setCollaboratorQuery] = useState("");
    const [collaboratorResults, setCollaboratorResults] = useState([]);
    const [isSearchingCollaborators, setIsSearchingCollaborators] =
        useState(false);
    const [showNetModal, setShowNetModal] = useState(false);
    const [showUnallocatedModal, setShowUnallocatedModal] = useState(false);
    const [showCreditModal, setShowCreditModal] = useState(false);
    const [deletingBudget, setDeletingBudget] = useState(null);
    const [deleteForm, setDeleteForm] = useState({
        action: "none",
        target_budget_id: "",
        target_goal_id: "",
        new_budget_name: "",
        new_budget_category_id: "",
        new_budget_account_id: "",
    });

    const walletSelection = useMemo(() => props.wallets ?? [], [props.wallets]);
    const collaborators = useMemo(
        () => props.collaborators ?? [],
        [props.collaborators]
    );
    const creditCardAccounts = useMemo(
        () => accounts.filter((account) => account.type === "credit-card"),
        [accounts]
    );
    const creditCardCharges = useMemo(
        () =>
            transactions.filter(
                (transaction) =>
                    transaction.finance_credit_card_account_id &&
                    transaction.type === "expense"
            ),
        [transactions]
    );
    const activeWallet = props.activeWallet ?? null;

    useEffect(() => {
        setActiveWalletId(props.walletUserId ?? props.activeWallet?.id ?? null);
    }, [props.walletUserId, props.activeWallet?.id]);

    useEffect(() => {
        if (!showCollaboratorsModal) {
            return;
        }

        if (collaboratorQuery.trim().length < 2) {
            setCollaboratorResults([]);
            return;
        }

        const handle = window.setTimeout(async () => {
            setIsSearchingCollaborators(true);
            try {
                const response = await window.axios.get(
                    route("weviewallet.api.collaborators.search"),
                    { params: { query: collaboratorQuery } }
                );
                setCollaboratorResults(response.data ?? []);
            } finally {
                setIsSearchingCollaborators(false);
            }
        }, 250);

        return () => window.clearTimeout(handle);
    }, [collaboratorQuery, showCollaboratorsModal]);

    const transactionsStoreUrl = useMemo(
        () => route("weviewallet.api.transactions.store"),
        []
    );
    const transactionsDeleteUrl = useMemo(
        () => route("weviewallet.api.transactions.index"),
        []
    );
    const transactionsUpdateUrl = useMemo(
        () => route("weviewallet.api.transactions.index"),
        []
    );
    const budgetsStoreUrl = useMemo(
        () => route("weviewallet.api.budgets.store"),
        []
    );
    const budgetsDeleteUrl = useMemo(
        () => route("weviewallet.api.budgets.index"),
        []
    );
    const savingsGoalsStoreUrl = useMemo(
        () => route("weviewallet.api.savings-goals.store"),
        []
    );
    const savingsGoalsDeleteUrl = useMemo(
        () => route("weviewallet.api.savings-goals.index"),
        []
    );
    const loansStoreUrl = useMemo(
        () => route("weviewallet.api.loans.store"),
        []
    );
    const loansDeleteUrl = useMemo(
        () => route("weviewallet.api.loans.index"),
        []
    );
    const loansUpdateUrl = useMemo(
        () => route("weviewallet.api.loans.index"),
        []
    );
    const refreshDashboardPage = useCallback(() => {
        setIsReloading(true);
        window.setTimeout(() => {
            window.location.reload();
        }, 100);
    }, []);

    const handleViewAll = useCallback(async () => {
        setIsLoadingTransactions(true);
        router.get(route("weviewallet.transactions.index"), {
            wallet_user_id: activeWalletId || undefined,
        });
        window.setTimeout(() => setIsLoadingTransactions(false), 300);
    }, [activeWalletId]);

    const handleWalletChange = useCallback(
        (event) => {
            const nextId = event.target.value
                ? Number(event.target.value)
                : null;
            setActiveWalletId(nextId);
            router.get(
                route("weviewallet.dashboard"),
                {
                    wallet_user_id: nextId || undefined,
                },
                { preserveScroll: true }
            );
        },
        [setActiveWalletId]
    );

    const handleAddCollaborator = useCallback(
        (event) => {
            event.preventDefault();
            addCollaboratorForm.post(
                route("weviewallet.collaborators.store"),
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        addCollaboratorForm.reset();
                        setCollaboratorQuery("");
                        setCollaboratorResults([]);
                    },
                }
            );
        },
        [addCollaboratorForm]
    );

    const handleRemoveCollaborator = useCallback((collaboratorId) => {
        if (
            !window.confirm(
                "Remove this collaborator? You can invite them again anytime."
            )
        ) {
            return;
        }
        router.delete(
            route("weviewallet.collaborators.destroy", collaboratorId),
            { preserveScroll: true }
        );
    }, []);

    const handleSelectCollaborator = useCallback(
        (user) => {
            addCollaboratorForm.setData("user_id", user.id);
            addCollaboratorForm.setData("email", user.email);
            setCollaboratorQuery(user.email);
            setCollaboratorResults([]);
        },
        [addCollaboratorForm]
    );

    const handleCreateTransaction = useCallback(
        async (formData) => {
            const loanSelected = Boolean(formData.finance_loan_id);
            const payload = {
                ...formData,
                wallet_user_id: activeWalletId || undefined,
                amount: formData.amount ? Number(formData.amount) : 0,
                finance_category_id: formData.finance_category_id || null,
                finance_loan_id: formData.finance_loan_id || null,
                finance_savings_goal_id: formData.finance_savings_goal_id || null,
                finance_account_id: formData.finance_account_id || null,
                finance_credit_card_account_id:
                    formData.finance_credit_card_account_id || null,
                finance_budget_id: loanSelected
                    ? null
                    : formData.finance_budget_id || null,
            };

            await window.axios.post(transactionsStoreUrl, payload);
            refreshDashboardPage();
            return true;
        },
        [activeWalletId, refreshDashboardPage, transactionsStoreUrl]
    );

    const normalizeBudgetPayload = useCallback(
        (formData) => {
            const nonRecurring = formData.is_recurring === false;
            return {
                ...formData,
                wallet_user_id: activeWalletId || undefined,
                amount: formData.amount ? Number(formData.amount) : 0,
                finance_category_id: formData.finance_category_id || null,
                finance_account_id: formData.finance_account_id || null,
                period: nonRecurring ? null : formData.period || null,
                starts_on: nonRecurring ? null : formData.starts_on || null,
                ends_on: nonRecurring ? null : formData.ends_on || null,
                budget_type: formData.budget_type || "spending",
            };
        },
        [activeWalletId]
    );

    const handleCreateBudget = useCallback(
        async (formData) => {
            const payload = normalizeBudgetPayload(formData);

            await window.axios.post(budgetsStoreUrl, payload);
            refreshDashboardPage();
            return true;
        },
        [budgetsStoreUrl, normalizeBudgetPayload, refreshDashboardPage]
    );

    const handleEditBudget = useCallback(
        async (formData) => {
            if (!formData?.id) {
                return false;
            }

            const payload = normalizeBudgetPayload(formData);

            await window.axios.put(
                `${budgetsDeleteUrl}/${formData.id}`,
                payload
            );
            refreshDashboardPage();
            return true;
        },
        [budgetsDeleteUrl, normalizeBudgetPayload, refreshDashboardPage]
    );

    const handleCreateSavingsGoal = useCallback(
        async (formData) => {
            const payload = {
                ...formData,
                wallet_user_id: activeWalletId || undefined,
                finance_account_id: formData.finance_account_id || null,
                target_amount: formData.target_amount
                    ? Number(formData.target_amount)
                    : 0,
                current_amount: formData.current_amount
                    ? Number(formData.current_amount)
                    : 0,
            };

            await window.axios.post(savingsGoalsStoreUrl, payload);
            refreshDashboardPage();
            return true;
        },
        [activeWalletId, refreshDashboardPage, savingsGoalsStoreUrl]
    );

    const handleEditSavingsGoal = useCallback(
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
                `${savingsGoalsDeleteUrl}/${formData.id}`,
                payload
            );
            refreshDashboardPage();
            return true;
        },
        [refreshDashboardPage, savingsGoalsDeleteUrl]
    );

    const handleCreateLoan = useCallback(
        async (formData) => {
            const payload = {
                ...formData,
                wallet_user_id: activeWalletId || undefined,
                total_amount: formData.total_amount
                    ? Number(formData.total_amount)
                    : 0,
                remaining_amount:
                    formData.remaining_amount === "" ||
                    formData.remaining_amount === null ||
                    formData.remaining_amount === undefined
                        ? null
                        : Number(formData.remaining_amount),
            };

            await window.axios.post(loansStoreUrl, payload);
            refreshDashboardPage();
            return true;
        },
        [activeWalletId, loansStoreUrl, refreshDashboardPage]
    );


    const handleDeleteBudget = useCallback(
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
            await window.axios.post(`${budgetsDeleteUrl}/${budget.id}/delete`);
            refreshDashboardPage();
        },
        [budgetsDeleteUrl, refreshDashboardPage]
    );

    const handleDeleteSavingsGoal = useCallback(
        async (goal) => {
            await window.axios.delete(
                `${savingsGoalsDeleteUrl}/${goal.id}`
            );
            refreshDashboardPage();
        },
        [refreshDashboardPage, savingsGoalsDeleteUrl]
    );

    const handleConvertSavingsGoal = useCallback(
        async (goal) => {
            await window.axios.post(
                `${savingsGoalsDeleteUrl}/${goal.id}/convert`
            );
            refreshDashboardPage();
        },
        [refreshDashboardPage, savingsGoalsDeleteUrl]
    );

    const handleDeleteLoan = useCallback(
        async (loan) => {
            await window.axios.delete(`${loansDeleteUrl}/${loan.id}`);
            refreshDashboardPage();
        },
        [loansDeleteUrl, refreshDashboardPage]
    );

    const handleEditLoan = useCallback(
        async (formData) => {
            if (!formData?.id) {
                return false;
            }

            const payload = {
                ...formData,
                total_amount: formData.total_amount
                    ? Number(formData.total_amount)
                    : 0,
                remaining_amount:
                    formData.remaining_amount === "" ||
                    formData.remaining_amount === null ||
                    formData.remaining_amount === undefined
                        ? null
                        : Number(formData.remaining_amount),
            };

            await window.axios.put(
                `${loansUpdateUrl}/${formData.id}`,
                payload
            );
            refreshDashboardPage();
            return true;
        },
        [loansUpdateUrl, refreshDashboardPage]
    );

    const handleDeleteTransaction = useCallback(
        async (transaction) => {
            await window.axios.delete(
                `${transactionsDeleteUrl}/${transaction.id}`
            );
            refreshDashboardPage();
        },
        [refreshDashboardPage, transactionsDeleteUrl]
    );

    const handleDeleteBudgetSubmit = useCallback(async () => {
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
            `${budgetsDeleteUrl}/${deletingBudget.id}/delete`,
            payload
        );
        refreshDashboardPage();
        setDeletingBudget(null);
    }, [budgetsDeleteUrl, deleteForm, deletingBudget, refreshDashboardPage]);

    const handleViewRelatedTransactions = useCallback(
        async (payload) => {
            setViewEntity(payload);
            setIsLoadingRelated(true);
            try {
                const response = await window.axios.get(
                    route("weviewallet.api.transactions.related"),
                    {
                        params: {
                            wallet_user_id: activeWalletId || undefined,
                            ...payload.params,
                        },
                    }
                );
                setRelatedTransactions(response.data ?? []);
            } finally {
                setIsLoadingRelated(false);
            }
        },
        [activeWalletId]
    );

    const handleEditTransaction = useCallback(
        async (formData) => {
            if (!formData?.id) {
                return false;
            }

            const loanSelected = Boolean(formData.finance_loan_id);
            const payload = {
                ...formData,
                amount: formData.amount ? Number(formData.amount) : 0,
                finance_category_id: formData.finance_category_id || null,
                finance_loan_id: formData.finance_loan_id || null,
                finance_savings_goal_id: formData.finance_savings_goal_id || null,
                finance_account_id: formData.finance_account_id || null,
                finance_credit_card_account_id:
                    formData.finance_credit_card_account_id || null,
                finance_budget_id: loanSelected
                    ? null
                    : formData.finance_budget_id || null,
            };

            await window.axios.put(
                `${transactionsUpdateUrl}/${formData.id}`,
                payload
            );
            refreshDashboardPage();
            return true;
        },
        [refreshDashboardPage, transactionsUpdateUrl]
    );

    const activeWalletLabel = props.isWalletOwner
        ? "Mine"
        : activeWallet?.name ?? "Wallet";

    return (
        <TodoLayout
            header={
                <div className="flex flex-wrap items-center gap-2">
                    <span>WevieWallet</span>
                    <Dropdown>
                        <Dropdown.Trigger>
                            <button
                                type="button"
                                className="rounded-full bg-light-hover px-3 py-1 text-xs font-semibold text-light-secondary hover:bg-light-border/70 dark:bg-dark-hover dark:text-dark-secondary dark:hover:bg-dark-border/70"
                                title="Select wallet"
                            >
                                {activeWalletLabel}
                            </button>
                        </Dropdown.Trigger>
                        <Dropdown.Content
                            align="left"
                            width="48"
                            contentClasses="py-1 bg-white dark:bg-dark-card"
                        >
                            {walletSelection.map((wallet) => (
                                <button
                                    key={wallet.id}
                                    type="button"
                                    onClick={() =>
                                        handleWalletChange({
                                            target: {
                                                value: String(wallet.id),
                                            },
                                        })
                                    }
                                    className="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-light-secondary hover:bg-light-hover dark:text-dark-secondary dark:hover:bg-dark-hover"
                                >
                                    <span>{wallet.name}</span>
                                    <span className="text-xs text-light-muted dark:text-dark-muted">
                                        {wallet.type === "owned"
                                            ? "Mine"
                                            : "Shared"}
                                    </span>
                                </button>
                            ))}
                        </Dropdown.Content>
                    </Dropdown>
                </div>
            }
        >
            <Head title="WevieWallet" />
            <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                <FinanceDashboard
                    summary={summary}
                    charts={charts}
                    transactions={transactions}
                    categories={categories}
                    budgets={budgets}
                    savingsGoals={savingsGoals}
                    loans={loans}
                    accounts={accounts}
                    tier={props.tier ?? "free"}
                    canAccessAdvancedCharts={
                        props.canAccessAdvancedCharts ?? true
                    }
                    onViewAllTransactions={handleViewAll}
                    isLoadingTransactions={isLoadingTransactions}
                    onCreateTransaction={handleCreateTransaction}
                    onCreateBudget={handleCreateBudget}
                    onCreateSavingsGoal={handleCreateSavingsGoal}
                    onCreateLoan={handleCreateLoan}
                    onDeleteBudget={handleDeleteBudget}
                    onDeleteSavingsGoal={handleDeleteSavingsGoal}
                    onConvertSavingsGoal={handleConvertSavingsGoal}
                    onDeleteLoan={handleDeleteLoan}
                    onDeleteTransaction={handleDeleteTransaction}
                    onEditLoan={handleEditLoan}
                    onEditBudget={handleEditBudget}
                    onEditSavingsGoal={handleEditSavingsGoal}
                    onEditTransaction={handleEditTransaction}
                    onViewLoan={(loan) =>
                        handleViewRelatedTransactions({
                            title: `${loan.name} transactions`,
                            params: { finance_loan_id: loan.id },
                        })
                    }
                    onViewGoal={(goal) =>
                        handleViewRelatedTransactions({
                            title: `${goal.name} transactions`,
                            params: { finance_savings_goal_id: goal.id },
                        })
                    }
                    onViewBudget={(budget) =>
                        handleViewRelatedTransactions({
                            title: `${budget.name} transactions`,
                            params: { finance_budget_id: budget.id },
                        })
                    }
                    onIncomeSummary={() =>
                        router.get(route("weviewallet.transactions.index"), {
                            type: "income",
                            wallet_user_id: activeWalletId || undefined,
                        })
                    }
                    onUnallocatedSummary={() => setShowUnallocatedModal(true)}
                    onExpensesSummary={() =>
                        router.get(route("weviewallet.transactions.index"), {
                            type: "expense",
                            wallet_user_id: activeWalletId || undefined,
                        })
                    }
                    onSavingsSummary={() =>
                        router.get(route("weviewallet.transactions.index"), {
                            type: "savings",
                            wallet_user_id: activeWalletId || undefined,
                        })
                    }
                    onNetSummary={() => setShowNetModal(true)}
                    onLoansSummary={() =>
                        router.get(route("weviewallet.loans.index"), {
                            wallet_user_id: activeWalletId || undefined,
                        })
                    }
                    onAvailableCreditSummary={() => setShowCreditModal(true)}
                    onOpenCollaborators={() =>
                        setShowCollaboratorsModal(true)
                    }
                    walletUserId={activeWalletId}
                    isWalletOwner={props.isWalletOwner}
                />
            </div>
            {isReloading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                    <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-soft dark:bg-dark-card">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-wevie-teal border-t-transparent" />
                        <span className="text-sm font-medium text-light-secondary dark:text-dark-secondary">
                            Refreshing your view...
                        </span>
                    </div>
                </div>
            )}
            <Modal
                show={Boolean(viewEntity)}
                onClose={() => {
                    setViewEntity(null);
                    setRelatedTransactions([]);
                }}
                maxWidth="2xl"
            >
                <div className="border-b border-light-border/70 px-6 py-4 dark:border-dark-border/70">
                    <h3 className="text-lg font-semibold text-light-primary dark:text-dark-primary">
                        {viewEntity?.title ?? "Transactions"}
                    </h3>
                </div>
                <div className="px-6 py-4">
                    {isLoadingRelated ? (
                        <p className="text-sm text-light-muted dark:text-dark-muted">
                            Loading details...
                        </p>
                    ) : relatedTransactions.length === 0 ? (
                        <p className="text-sm text-light-muted dark:text-dark-muted">
                            Nothing linked yet.
                        </p>
                    ) : (
                        <div className="space-y-3 text-sm text-light-secondary dark:text-dark-secondary">
                            {relatedTransactions.map((transaction) => (
                                <div
                                    key={transaction.id}
                                    className="rounded-xl border border-light-border/70 px-3 py-2 dark:border-dark-border/70"
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
                                                {new Intl.NumberFormat("en-PH", {
                                                    style: "currency",
                                                    currency:
                                                        transaction.currency ??
                                                        "PHP",
                                                    maximumFractionDigits: 2,
                                                }).format(transaction.amount ?? 0)}
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
                show={showNetModal}
                onClose={() => setShowNetModal(false)}
                maxWidth="lg"
            >
                <div className="border-b border-light-border/70 px-6 py-4 dark:border-dark-border/70">
                    <h3 className="text-lg font-semibold text-light-primary dark:text-dark-primary">
                        Net summary
                    </h3>
                </div>
                <div className="px-6 py-4 space-y-4 text-sm text-light-secondary dark:text-dark-secondary">
                    <p>
                        Net = Income + Savings - Expenses
                    </p>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span>Income</span>
                            <span className="font-semibold text-emerald-600">
                                {new Intl.NumberFormat("en-PH", {
                                    style: "currency",
                                    currency: "PHP",
                                    maximumFractionDigits: 2,
                                }).format(summary?.income ?? 0)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Savings</span>
                            <span className="font-semibold text-violet-600">
                                {new Intl.NumberFormat("en-PH", {
                                    style: "currency",
                                    currency: "PHP",
                                    maximumFractionDigits: 2,
                                }).format(summary?.savings ?? 0)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Expenses</span>
                            <span className="font-semibold text-rose-600">
                                {new Intl.NumberFormat("en-PH", {
                                    style: "currency",
                                    currency: "PHP",
                                    maximumFractionDigits: 2,
                                }).format(summary?.expenses ?? 0)}
                            </span>
                        </div>
                        <div className="border-t border-light-border/70 pt-2 flex items-center justify-between dark:border-dark-border/70">
                            <span className="font-semibold">Net</span>
                            <span className="font-semibold text-light-primary dark:text-dark-primary">
                                {new Intl.NumberFormat("en-PH", {
                                    style: "currency",
                                    currency: "PHP",
                                    maximumFractionDigits: 2,
                                }).format(summary?.net ?? 0)}
                            </span>
                        </div>
                    </div>
                </div>
            </Modal>
            <Modal
                show={showUnallocatedModal}
                onClose={() => setShowUnallocatedModal(false)}
                maxWidth="lg"
            >
                <div className="border-b border-light-border/70 px-6 py-4 dark:border-dark-border/70">
                    <h3 className="text-lg font-semibold text-light-primary dark:text-dark-primary">
                        Unassigned funds
                    </h3>
                </div>
                <div className="px-6 py-4 space-y-4 text-sm text-light-secondary dark:text-dark-secondary">
                    <p>
                        Unassigned = (Income + Loans) - Savings - Expenses
                    </p>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span>Income</span>
                            <span className="font-semibold text-emerald-600">
                                {new Intl.NumberFormat("en-PH", {
                                    style: "currency",
                                    currency: "PHP",
                                    maximumFractionDigits: 2,
                                }).format(summary?.income ?? 0)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Loans</span>
                            <span className="font-semibold text-cyan-600">
                                {new Intl.NumberFormat("en-PH", {
                                    style: "currency",
                                    currency: "PHP",
                                    maximumFractionDigits: 2,
                                }).format(summary?.borrowed ?? 0)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Savings</span>
                            <span className="font-semibold text-violet-600">
                                {new Intl.NumberFormat("en-PH", {
                                    style: "currency",
                                    currency: "PHP",
                                    maximumFractionDigits: 2,
                                }).format(summary?.savings ?? 0)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Expenses</span>
                            <span className="font-semibold text-rose-600">
                                {new Intl.NumberFormat("en-PH", {
                                    style: "currency",
                                    currency: "PHP",
                                    maximumFractionDigits: 2,
                                }).format(summary?.expenses ?? 0)}
                            </span>
                        </div>
                        <div className="border-t border-light-border/70 pt-2 flex items-center justify-between dark:border-dark-border/70">
                            <span className="font-semibold">Unallocated</span>
                            <span className="font-semibold text-light-primary dark:text-dark-primary">
                                {new Intl.NumberFormat("en-PH", {
                                    style: "currency",
                                    currency: "PHP",
                                    maximumFractionDigits: 2,
                                }).format(summary?.unallocated ?? 0)}
                            </span>
                        </div>
                    </div>
                </div>
            </Modal>
            <Modal
                show={showCreditModal}
                onClose={() => setShowCreditModal(false)}
                maxWidth="lg"
            >
                <div className="border-b border-light-border/70 px-6 py-4 dark:border-dark-border/70">
                    <h3 className="text-lg font-semibold text-light-primary dark:text-dark-primary">
                        Available credit
                    </h3>
                </div>
                <div className="px-6 py-4 space-y-4 text-sm text-light-secondary dark:text-dark-secondary">
                    <div className="space-y-3">
                        {creditCardAccounts.length === 0 ? (
                            <p className="text-sm text-light-muted dark:text-dark-muted">
                                No credit card accounts yet.
                            </p>
                        ) : (
                            creditCardAccounts.map((account) => {
                                const charges = creditCardCharges.filter(
                                    (transaction) =>
                                        transaction.finance_credit_card_account_id ===
                                        account.id
                                );

                                return (
                                    <div
                                        key={account.id}
                                        className="rounded-xl border border-light-border/70 px-3 py-2 dark:border-dark-border/70"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <p className="font-medium text-light-primary dark:text-dark-primary">
                                                    {account.label ||
                                                        account.name}
                                                </p>
                                                <p className="text-xs text-light-muted dark:text-dark-muted">
                                                    Limit:{" "}
                                                    {new Intl.NumberFormat(
                                                        "en-PH",
                                                        {
                                                            style: "currency",
                                                            currency:
                                                                account.currency ??
                                                                "PHP",
                                                            maximumFractionDigits: 2,
                                                        }
                                                    ).format(
                                                        account.credit_limit ??
                                                            0
                                                    )}
                                                </p>
                                            </div>
                                            <p className="font-semibold text-amber-600">
                                                {new Intl.NumberFormat("en-PH", {
                                                    style: "currency",
                                                    currency:
                                                        account.currency ??
                                                        "PHP",
                                                    maximumFractionDigits: 2,
                                                }).format(
                                                    account.available_credit ??
                                                        0
                                                )}
                                            </p>
                                        </div>
                                        <div className="mt-3 space-y-2 text-xs text-light-muted dark:text-dark-muted">
                                            <p className="font-semibold uppercase text-light-muted dark:text-dark-muted">
                                                Charges
                                            </p>
                                            {charges.length === 0 ? (
                                                <p className="text-light-muted dark:text-dark-muted">
                                                    No charges yet.
                                                </p>
                                            ) : (
                                                charges.map((transaction) => (
                                                    <div
                                                        key={transaction.id}
                                                        className="flex flex-wrap items-center justify-between gap-2 border-t border-light-border/70 pt-2 dark:border-dark-border/70"
                                                    >
                                                        <div>
                                                            <p className="text-sm text-light-secondary dark:text-dark-secondary">
                                                                {
                                                                    transaction.description
                                                                }
                                                            </p>
                                                            <p className="text-xs text-light-muted dark:text-dark-muted">
                                                                {new Date(
                                                                    transaction.occurred_at ??
                                                                        transaction.created_at ??
                                                                        Date.now()
                                                                ).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <p className="text-sm font-semibold text-rose-600">
                                                            {new Intl.NumberFormat(
                                                                "en-PH",
                                                                {
                                                                    style: "currency",
                                                                    currency:
                                                                        transaction.currency ??
                                                                        account.currency ??
                                                                        "PHP",
                                                                    maximumFractionDigits: 2,
                                                                }
                                                            ).format(
                                                                transaction.amount ??
                                                                    0
                                                            )}
                                                        </p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                    <div className="border-t border-light-border/70 pt-3 flex items-center justify-between dark:border-dark-border/70">
                        <span className="font-semibold">Total available</span>
                        <span className="font-semibold text-light-primary dark:text-dark-primary">
                            {new Intl.NumberFormat("en-PH", {
                                style: "currency",
                                currency: "PHP",
                                maximumFractionDigits: 2,
                            }).format(summary?.available_credit ?? 0)}
                        </span>
                    </div>
                </div>
            </Modal>
            <Modal
                show={Boolean(deletingBudget)}
                onClose={() => setDeletingBudget(null)}
                maxWidth="lg"
            >
                <div className="border-b border-light-border/70 px-6 py-4 dark:border-dark-border/70">
                    <h3 className="text-lg font-semibold text-light-primary dark:text-dark-primary">
                        Remove budget
                    </h3>
                </div>
                <div className="px-6 py-4 space-y-4">
                    <p className="text-sm text-light-secondary dark:text-dark-secondary">
                        Remaining{" "}
                        <span className="font-semibold">
                            {new Intl.NumberFormat("en-PH", {
                                style: "currency",
                                currency: deletingBudget?.currency ?? "PHP",
                                maximumFractionDigits: 2,
                            }).format(
                                Math.max(
                                    0,
                                    Number(deletingBudget?.amount ?? 0) -
                                        Number(
                                            deletingBudget?.current_spent ?? 0
                                        )
                                )
                            )}
                        </span>
                        . Choose where it should go next.
                    </p>
                    <div>
                        <label className="text-sm text-light-muted dark:text-dark-muted">
                            Action
                        </label>
                        <select
                            className="mt-1 w-full rounded-xl border border-light-border/70 px-3 py-2 text-sm focus:border-wevie-teal focus:outline-none focus:ring-1 focus:ring-wevie-teal/30 dark:border-dark-border/70 dark:bg-dark-card"
                            value={deleteForm.action}
                            onChange={(event) =>
                                setDeleteForm((prev) => ({
                                    ...prev,
                                    action: event.target.value,
                                }))
                            }
                        >
                            <option value="none">Remove without reallocating</option>
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
                                className="mt-1 w-full rounded-xl border border-light-border/70 px-3 py-2 text-sm focus:border-wevie-teal focus:outline-none focus:ring-1 focus:ring-wevie-teal/30 dark:border-dark-border/70 dark:bg-dark-card"
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
                                <label className="text-sm text-light-muted dark:text-dark-muted">
                                    New budget name
                                </label>
                                <input
                                    className="mt-1 w-full rounded-xl border border-light-border/70 px-3 py-2 text-sm focus:border-wevie-teal focus:outline-none focus:ring-1 focus:ring-wevie-teal/30 dark:border-dark-border/70 dark:bg-dark-card"
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
                                    className="mt-1 w-full rounded-xl border border-light-border/70 px-3 py-2 text-sm focus:border-wevie-teal focus:outline-none focus:ring-1 focus:ring-wevie-teal/30 dark:border-dark-border/70 dark:bg-dark-card"
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
                                    className="mt-1 w-full rounded-xl border border-light-border/70 px-3 py-2 text-sm focus:border-wevie-teal focus:outline-none focus:ring-1 focus:ring-wevie-teal/30 dark:border-dark-border/70 dark:bg-dark-card"
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
                            <label className="text-sm text-light-muted dark:text-dark-muted">
                                Target savings goal
                            </label>
                            <select
                                className="mt-1 w-full rounded-xl border border-light-border/70 px-3 py-2 text-sm focus:border-wevie-teal focus:outline-none focus:ring-1 focus:ring-wevie-teal/30 dark:border-dark-border/70 dark:bg-dark-card"
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
                            className="rounded-xl border border-light-border/70 px-3 py-2 text-sm font-semibold text-light-secondary hover:border-light-border hover:text-light-primary dark:border-dark-border/70 dark:text-dark-secondary dark:hover:text-dark-primary"
                        >
                            Not now
                        </button>
                        <button
                            type="button"
                            onClick={handleDeleteBudgetSubmit}
                            className="rounded-xl bg-rose-500 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-400"
                        >
                            Remove budget
                        </button>
                    </div>
                </div>
            </Modal>
            <Modal
                show={showCollaboratorsModal}
                onClose={() => setShowCollaboratorsModal(false)}
                maxWidth="2xl"
            >
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-light-primary dark:text-dark-primary">
                        Wallet collaborators
                    </h2>
                    <p className="mt-1 text-sm text-light-muted dark:text-dark-muted">
                        Collaborators can view and manage this wallet.
                    </p>

                    <div className="mt-4 space-y-2">
                        {collaborators.length > 0 ? (
                            collaborators.map((collaborator) => (
                                <div
                                    key={collaborator.id}
                                className="flex items-center justify-between rounded-xl border border-light-border/70 px-3 py-2 text-sm dark:border-dark-border/70"
                                >
                                    <div>
                                    <p className="font-semibold text-light-primary dark:text-dark-primary">
                                            {collaborator.name}
                                        </p>
                                    <p className="text-xs text-light-muted dark:text-dark-muted">
                                            {collaborator.email}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleRemoveCollaborator(
                                                collaborator.id
                                            )
                                        }
                                    className="inline-flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30"
                                    >
                                        <X className="h-3 w-3" />
                                        Remove
                                    </button>
                                </div>
                            ))
                        ) : (
                        <p className="text-sm text-light-muted dark:text-dark-muted">
                            No collaborators yet.
                            </p>
                        )}
                    </div>

                    <div className="mt-6 border-t border-light-border/70 pt-4 dark:border-dark-border/70">
                        <h3 className="text-sm font-semibold text-light-secondary dark:text-dark-secondary">
                            Add collaborator
                        </h3>
                        <form
                            onSubmit={handleAddCollaborator}
                            className="mt-3 space-y-3"
                        >
                            <div>
                                <InputLabel
                                    htmlFor="wallet_collaborator_email"
                                    value="Email address"
                                />
                                <TextInput
                                    id="wallet_collaborator_email"
                                    type="email"
                                    className="mt-1 block w-full"
                                    value={collaboratorQuery}
                                    onChange={(event) =>
                                        (() => {
                                            const value = event.target.value;
                                            setCollaboratorQuery(value);
                                            addCollaboratorForm.setData(
                                                "email",
                                                value
                                            );
                                            addCollaboratorForm.setData(
                                                "user_id",
                                                null
                                            );
                                        })()
                                    }
                                    placeholder="Enter collaborator email"
                                    required
                                />
                                <InputError
                                    message={addCollaboratorForm.errors.email}
                                    className="mt-2"
                                />
                                {isSearchingCollaborators && (
                                    <p className="mt-2 text-xs text-light-muted dark:text-dark-muted">
                                        Searching gently...
                                    </p>
                                )}
                                {!isSearchingCollaborators &&
                                    collaboratorResults.length > 0 && (
                                        <div className="mt-3 space-y-2 rounded-xl border border-light-border/70 p-2 text-sm dark:border-dark-border/70">
                                            {collaboratorResults.map(
                                                (user) => (
                                                    <button
                                                        type="button"
                                                        key={user.id}
                                                        onClick={() =>
                                                            handleSelectCollaborator(
                                                                user
                                                            )
                                                        }
                                                        className="flex w-full items-center justify-between rounded-lg px-2 py-1 text-left hover:bg-light-hover dark:hover:bg-dark-hover"
                                                    >
                                                        <span className="font-medium text-light-primary dark:text-dark-primary">
                                                            {user.name}
                                                        </span>
                                                        <span className="text-xs text-light-muted dark:text-dark-muted">
                                                            {user.email}
                                                        </span>
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    )}
                            </div>
                            <div className="flex justify-end">
                                <PrimaryButton
                                    type="submit"
                                    disabled={addCollaboratorForm.processing}
                                >
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    {addCollaboratorForm.processing
                                        ? "Adding..."
                                        : addCollaboratorForm.data.user_id
                                          ? "Add collaborator"
                                          : "Send invite"}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </Modal>
        </TodoLayout>
    );
}

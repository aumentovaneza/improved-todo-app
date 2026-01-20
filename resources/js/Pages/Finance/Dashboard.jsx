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
    const [summary, setSummary] = useState(props.summary ?? {});
    const [charts, setCharts] = useState(props.charts ?? {});
    const [categories, setCategories] = useState(props.categories ?? []);
    const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
    const [isReloading, setIsReloading] = useState(false);
    const [showCollaboratorsModal, setShowCollaboratorsModal] = useState(false);
    const [activeWalletId, setActiveWalletId] = useState(
        props.walletUserId ?? props.activeWallet?.id ?? null
    );
    const addCollaboratorForm = useForm({ email: "", user_id: null });
    const [collaboratorQuery, setCollaboratorQuery] = useState("");
    const [collaboratorResults, setCollaboratorResults] = useState([]);
    const [isSearchingCollaborators, setIsSearchingCollaborators] =
        useState(false);

    const walletSelection = useMemo(() => props.wallets ?? [], [props.wallets]);
    const collaborators = useMemo(
        () => props.collaborators ?? [],
        [props.collaborators]
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
                "Are you sure you want to remove this collaborator?"
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

    const handleCreateBudget = useCallback(
        async (formData) => {
            const payload = {
                ...formData,
                wallet_user_id: activeWalletId || undefined,
                amount: formData.amount ? Number(formData.amount) : 0,
                finance_category_id: formData.finance_category_id || null,
            };

            await window.axios.post(budgetsStoreUrl, payload);
            refreshDashboardPage();
            return true;
        },
        [activeWalletId, budgetsStoreUrl, refreshDashboardPage]
    );

    const handleEditBudget = useCallback(
        async (formData) => {
            if (!formData?.id) {
                return false;
            }

            const payload = {
                ...formData,
                amount: formData.amount ? Number(formData.amount) : 0,
                finance_category_id: formData.finance_category_id || null,
            };

            await window.axios.put(
                `${budgetsDeleteUrl}/${formData.id}`,
                payload
            );
            refreshDashboardPage();
            return true;
        },
        [budgetsDeleteUrl, refreshDashboardPage]
    );

    const handleCreateSavingsGoal = useCallback(
        async (formData) => {
            const payload = {
                ...formData,
                wallet_user_id: activeWalletId || undefined,
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
            await window.axios.delete(`${budgetsDeleteUrl}/${budget.id}`);
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
                                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                                title="Select wallet"
                            >
                                {activeWalletLabel}
                            </button>
                        </Dropdown.Trigger>
                        <Dropdown.Content
                            align="left"
                            width="48"
                            contentClasses="py-1 bg-white dark:bg-slate-900"
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
                                    className="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                    <span>{wallet.name}</span>
                                    <span className="text-xs text-slate-400">
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
                    onDeleteLoan={handleDeleteLoan}
                    onDeleteTransaction={handleDeleteTransaction}
                    onEditLoan={handleEditLoan}
                    onEditBudget={handleEditBudget}
                    onEditSavingsGoal={handleEditSavingsGoal}
                    onEditTransaction={handleEditTransaction}
                    onOpenCollaborators={() =>
                        setShowCollaboratorsModal(true)
                    }
                    walletUserId={activeWalletId}
                    isWalletOwner={props.isWalletOwner}
                />
            </div>
            {isReloading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                    <div className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 shadow-lg dark:bg-slate-900">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            Reloading...
                        </span>
                    </div>
                </div>
            )}
            <Modal
                show={showCollaboratorsModal}
                onClose={() => setShowCollaboratorsModal(false)}
                maxWidth="2xl"
            >
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Wallet collaborators
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Collaborators can view and manage this wallet.
                    </p>

                    <div className="mt-4 space-y-2">
                        {collaborators.length > 0 ? (
                            collaborators.map((collaborator) => (
                                <div
                                    key={collaborator.id}
                                    className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"
                                >
                                    <div>
                                        <p className="font-semibold text-slate-800 dark:text-slate-100">
                                            {collaborator.name}
                                        </p>
                                        <p className="text-xs text-slate-400">
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
                                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30"
                                    >
                                        <X className="h-3 w-3" />
                                        Remove
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-slate-400">
                                No collaborators yet.
                            </p>
                        )}
                    </div>

                    <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-700">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
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
                                    <p className="mt-2 text-xs text-slate-400">
                                        Searching users...
                                    </p>
                                )}
                                {!isSearchingCollaborators &&
                                    collaboratorResults.length > 0 && (
                                        <div className="mt-3 space-y-2 rounded-md border border-slate-200 p-2 text-sm dark:border-slate-700">
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
                                                        className="flex w-full items-center justify-between rounded-md px-2 py-1 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
                                                    >
                                                        <span className="font-medium text-slate-800 dark:text-slate-100">
                                                            {user.name}
                                                        </span>
                                                        <span className="text-xs text-slate-400">
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

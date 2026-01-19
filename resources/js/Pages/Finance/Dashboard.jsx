import FinanceDashboard from "@/Components/Finance/Dashboard/FinanceDashboard";
import TodoLayout from "@/Layouts/TodoLayout";
import { Head, router } from "@inertiajs/react";
import { useCallback, useMemo, useState } from "react";

export default function Dashboard(props) {
    const [transactions, setTransactions] = useState(props.transactions ?? []);
    const [budgets, setBudgets] = useState(props.budgets ?? []);
    const [savingsGoals, setSavingsGoals] = useState(
        props.savingsGoals ?? []
    );
    const [summary, setSummary] = useState(props.summary ?? {});
    const [charts, setCharts] = useState(props.charts ?? {});
    const [categories, setCategories] = useState(props.categories ?? []);
    const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
    const [isReloading, setIsReloading] = useState(false);

    const transactionsIndexUrl = useMemo(
        () => route("finance.api.transactions.index"),
        []
    );
    const transactionsStoreUrl = useMemo(
        () => route("finance.api.transactions.store"),
        []
    );
    const transactionsDeleteUrl = useMemo(
        () => route("finance.api.transactions.index"),
        []
    );
    const transactionsUpdateUrl = useMemo(
        () => route("finance.api.transactions.index"),
        []
    );
    const budgetsStoreUrl = useMemo(
        () => route("finance.api.budgets.store"),
        []
    );
    const budgetsDeleteUrl = useMemo(() => route("finance.api.budgets.index"), []);
    const savingsGoalsStoreUrl = useMemo(
        () => route("finance.api.savings-goals.store"),
        []
    );
    const savingsGoalsDeleteUrl = useMemo(
        () => route("finance.api.savings-goals.index"),
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
        try {
            await window.axios.get(transactionsIndexUrl);
            refreshDashboardPage();
        } finally {
            setIsLoadingTransactions(false);
        }
    }, [refreshDashboardPage, transactionsIndexUrl]);

    const handleCreateTransaction = useCallback(
        async (formData) => {
            const payload = {
                ...formData,
                amount: formData.amount ? Number(formData.amount) : 0,
                finance_category_id: formData.finance_category_id || null,
                finance_savings_goal_id: formData.finance_savings_goal_id || null,
                finance_budget_id: formData.finance_budget_id || null,
            };

            await window.axios.post(transactionsStoreUrl, payload);
            refreshDashboardPage();
            return true;
        },
        [refreshDashboardPage, transactionsStoreUrl]
    );

    const handleCreateBudget = useCallback(
        async (formData) => {
            const payload = {
                ...formData,
                amount: formData.amount ? Number(formData.amount) : 0,
                finance_category_id: formData.finance_category_id || null,
            };

            await window.axios.post(budgetsStoreUrl, payload);
            refreshDashboardPage();
            return true;
        },
        [budgetsStoreUrl, refreshDashboardPage]
    );

    const handleCreateSavingsGoal = useCallback(
        async (formData) => {
            const payload = {
                ...formData,
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
        [refreshDashboardPage, savingsGoalsStoreUrl]
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

            const payload = {
                ...formData,
                amount: formData.amount ? Number(formData.amount) : 0,
                finance_category_id: formData.finance_category_id || null,
                finance_savings_goal_id: formData.finance_savings_goal_id || null,
                finance_budget_id: formData.finance_budget_id || null,
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

    return (
        <TodoLayout header="WevieWallet">
            <Head title="WevieWallet" />
            <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                <FinanceDashboard
                    summary={summary}
                    charts={charts}
                    transactions={transactions}
                    categories={categories}
                    budgets={budgets}
                    savingsGoals={savingsGoals}
                    tier={props.tier ?? "free"}
                    canAccessAdvancedCharts={
                        props.canAccessAdvancedCharts ?? true
                    }
                    onViewAllTransactions={handleViewAll}
                    isLoadingTransactions={isLoadingTransactions}
                    onCreateTransaction={handleCreateTransaction}
                    onCreateBudget={handleCreateBudget}
                    onCreateSavingsGoal={handleCreateSavingsGoal}
                    onDeleteBudget={handleDeleteBudget}
                    onDeleteSavingsGoal={handleDeleteSavingsGoal}
                    onDeleteTransaction={handleDeleteTransaction}
                    onEditTransaction={handleEditTransaction}
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
        </TodoLayout>
    );
}

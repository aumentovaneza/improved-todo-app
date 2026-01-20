import BudgetForm from "@/Components/Finance/Budgets/BudgetForm";
import Modal from "@/Components/Modal";
import TodoLayout from "@/Layouts/TodoLayout";
import { Head, Link } from "@inertiajs/react";
import { useCallback, useState } from "react";

const formatCurrency = (value, currency = "PHP") =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(value ?? 0);

export default function Budgets({ budgets = [], categories = [], walletUserId }) {
    const [activeBudget, setActiveBudget] = useState(null);
    const refreshPage = useCallback(() => {
        window.location.reload();
    }, []);

    const handleCreate = useCallback(
        async (formData) => {
            const payload = {
                ...formData,
                wallet_user_id: walletUserId || undefined,
                amount: formData.amount ? Number(formData.amount) : 0,
                finance_category_id: formData.finance_category_id || null,
            };

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
            await window.axios.delete(
                `${route("weviewallet.api.budgets.index")}/${budget.id}`
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
                amount: formData.amount ? Number(formData.amount) : 0,
                finance_category_id: formData.finance_category_id || null,
            };

            await window.axios.put(
                `${route("weviewallet.api.budgets.index")}/${formData.id}`,
                payload
            );
            refreshPage();
            return true;
        },
        [refreshPage]
    );

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

                <BudgetForm categories={categories} onSubmit={handleCreate} />

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
                                            <p className="text-xs text-slate-400">
                                                {budget.category?.name ??
                                                    "All categories"}
                                            </p>
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
                                No budgets yet.
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
        </TodoLayout>
    );
}

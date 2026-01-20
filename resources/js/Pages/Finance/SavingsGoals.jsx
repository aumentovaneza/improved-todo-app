import SavingsGoalForm from "@/Components/Finance/SavingsGoals/SavingsGoalForm";
import SavingsGoalsList from "@/Components/Finance/SavingsGoals/SavingsGoalsList";
import Modal from "@/Components/Modal";
import TodoLayout from "@/Layouts/TodoLayout";
import { Head, Link } from "@inertiajs/react";
import { useCallback, useState } from "react";

export default function SavingsGoals({ savingsGoals = [], walletUserId }) {
    const [activeGoal, setActiveGoal] = useState(null);
    const refreshPage = useCallback(() => {
        window.location.reload();
    }, []);

    const handleCreate = useCallback(
        async (formData) => {
            const payload = {
                ...formData,
                wallet_user_id: walletUserId || undefined,
                target_amount: formData.target_amount
                    ? Number(formData.target_amount)
                    : 0,
                current_amount: formData.current_amount
                    ? Number(formData.current_amount)
                    : 0,
            };

            await window.axios.post(
                route("weviewallet.api.savings-goals.store"),
                payload
            );
            refreshPage();
            return true;
        },
        [refreshPage, walletUserId]
    );

    const handleDelete = useCallback(
        async (goal) => {
            await window.axios.delete(
                `${route("weviewallet.api.savings-goals.index")}/${goal.id}`
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
                target_amount: formData.target_amount
                    ? Number(formData.target_amount)
                    : 0,
                current_amount: formData.current_amount
                    ? Number(formData.current_amount)
                    : 0,
            };

            await window.axios.put(
                `${route("weviewallet.api.savings-goals.index")}/${formData.id}`,
                payload
            );
            refreshPage();
            return true;
        },
        [refreshPage]
    );

    return (
        <TodoLayout header="Savings goals">
            <Head title="Savings goals" />
            <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                                Savings goals
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Track all of your savings goals in one place.
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

                <SavingsGoalForm onSubmit={handleCreate} />
                <SavingsGoalsList
                    goals={savingsGoals}
                    onDelete={handleDelete}
                    onEdit={(goal) => setActiveGoal(goal)}
                />
            </div>

            <Modal
                show={Boolean(activeGoal)}
                onClose={() => setActiveGoal(null)}
                maxWidth="lg"
            >
                <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                        Edit savings goal
                    </h3>
                </div>
                <div className="px-6 py-4">
                    <SavingsGoalForm
                        initialValues={activeGoal}
                        submitLabel="Update goal"
                        onSubmit={(payload) =>
                            Promise.resolve(handleEdit(payload)).finally(() =>
                                setActiveGoal(null)
                            )
                        }
                    />
                </div>
            </Modal>
        </TodoLayout>
    );
}

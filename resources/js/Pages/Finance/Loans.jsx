import LoanForm from "@/Components/Finance/Loans/LoanForm";
import LoansList from "@/Components/Finance/Loans/LoansList";
import Modal from "@/Components/Modal";
import TodoLayout from "@/Layouts/TodoLayout";
import { Head, Link } from "@inertiajs/react";
import { useCallback, useState } from "react";

export default function Loans({ loans = [], walletUserId }) {
    const [activeLoan, setActiveLoan] = useState(null);

    const refreshPage = useCallback(() => {
        window.location.reload();
    }, []);

    const handleCreate = useCallback(
        async (formData) => {
            const payload = {
                ...formData,
                wallet_user_id: walletUserId || undefined,
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

            await window.axios.post(
                route("weviewallet.api.loans.store"),
                payload
            );
            refreshPage();
            return true;
        },
        [refreshPage, walletUserId]
    );

    const handleEdit = useCallback(
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
                `${route("weviewallet.api.loans.index")}/${formData.id}`,
                payload
            );
            refreshPage();
            return true;
        },
        [refreshPage]
    );

    const handleDelete = useCallback(
        async (loan) => {
            await window.axios.delete(
                `${route("weviewallet.api.loans.index")}/${loan.id}`
            );
            refreshPage();
        },
        [refreshPage]
    );

    return (
        <TodoLayout header="Loans">
            <Head title="Loans" />
            <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                                Loans
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Track every loan you are paying off.
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

                <LoanForm onSubmit={handleCreate} />
                <LoansList
                    loans={loans}
                    onDelete={handleDelete}
                    onEdit={(loan) => setActiveLoan(loan)}
                />
            </div>

            <Modal
                show={Boolean(activeLoan)}
                onClose={() => setActiveLoan(null)}
                maxWidth="lg"
            >
                <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                        Edit loan
                    </h3>
                </div>
                <div className="px-6 py-4">
                    <LoanForm
                        initialValues={activeLoan}
                        submitLabel="Update loan"
                        onSubmit={(payload) =>
                            Promise.resolve(handleEdit(payload)).finally(() =>
                                setActiveLoan(null)
                            )
                        }
                    />
                </div>
            </Modal>
        </TodoLayout>
    );
}

import LoanForm from "@/Components/Finance/Loans/LoanForm";
import LoansList from "@/Components/Finance/Loans/LoansList";
import Modal from "@/Components/Modal";
import TodoLayout from "@/Layouts/TodoLayout";
import { Head, Link, router } from "@inertiajs/react";
import { useCallback, useState } from "react";

export default function Loans({ loans = [], walletUserId, filters = {} }) {
    const [activeLoan, setActiveLoan] = useState(null);
    const [search, setSearch] = useState(filters.search ?? "");
    const [status, setStatus] = useState(filters.status ?? "all");
    const [viewLoan, setViewLoan] = useState(null);
    const [relatedTransactions, setRelatedTransactions] = useState([]);
    const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

    const refreshPage = useCallback(() => {
        window.location.reload();
    }, []);

    const handleFilterSubmit = (event) => {
        event.preventDefault();
        router.get(
            route("weviewallet.loans.index"),
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
        router.get(route("weviewallet.loans.index"), {
            wallet_user_id: walletUserId || undefined,
        });
    };

    const handleViewTransactions = useCallback(
        async (loan) => {
            setViewLoan(loan);
            setIsLoadingTransactions(true);
            try {
                const response = await window.axios.get(
                    route("weviewallet.api.transactions.related"),
                    {
                        params: {
                            wallet_user_id: walletUserId || undefined,
                            finance_loan_id: loan.id,
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
                            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                            Back to dashboard
                        </Link>
                    </div>
                </div>

                <LoanForm onSubmit={handleCreate} />
                <form
                    onSubmit={handleFilterSubmit}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                >
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <label className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500">
                                Search
                            </label>
                            <input
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                                placeholder="Search by loan name or notes"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500">
                                Status
                            </label>
                            <select
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                                value={status}
                                onChange={(event) =>
                                    setStatus(event.target.value)
                                }
                            >
                                <option value="all">All loans</option>
                                <option value="active">Active</option>
                                <option value="closed">Closed</option>
                            </select>
                        </div>
                        <div className="flex items-end gap-2 sm:col-span-2">
                            <button
                                type="submit"
                                className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500"
                            >
                                Apply filters
                            </button>
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </form>
                <LoansList
                    loans={loans}
                    onDelete={handleDelete}
                    onEdit={(loan) => setActiveLoan(loan)}
                    onView={handleViewTransactions}
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
            <Modal
                show={Boolean(viewLoan)}
                onClose={() => {
                    setViewLoan(null);
                    setRelatedTransactions([]);
                }}
                maxWidth="2xl"
            >
                <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                        {viewLoan?.name} transactions
                    </h3>
                </div>
                <div className="px-6 py-4">
                    {isLoadingTransactions ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Loading transactions...
                        </p>
                    ) : relatedTransactions.length === 0 ? (
                        <p className="text-sm text-slate-400 dark:text-slate-500">
                            No transactions linked to this loan yet.
                        </p>
                    ) : (
                        <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                            {relatedTransactions.map((transaction) => (
                                <div
                                    key={transaction.id}
                                    className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="font-medium text-slate-800 dark:text-slate-100">
                                                {transaction.description}
                                            </p>
                                            <p className="text-xs text-slate-400">
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
                                            <p className="text-xs text-slate-400">
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
        </TodoLayout>
    );
}

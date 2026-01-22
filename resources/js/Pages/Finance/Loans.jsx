import LoanForm from "@/Components/Finance/Loans/LoanForm";
import Modal from "@/Components/Modal";
import TodoLayout from "@/Layouts/TodoLayout";
import { Head, Link, router } from "@inertiajs/react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const formatCurrency = (value, currency = "PHP") =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(value ?? 0);

const formatDate = (value) =>
    value ? new Date(value).toLocaleDateString() : "-";

export default function Loans({ loans = [], walletUserId, filters = {} }) {
    const [activeLoan, setActiveLoan] = useState(null);
    const [search, setSearch] = useState(filters.search ?? "");
    const [status, setStatus] = useState(filters.status ?? "all");
    const [viewLoan, setViewLoan] = useState(null);
    const [relatedTransactions, setRelatedTransactions] = useState([]);
    const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
    const [page, setPage] = useState(1);
    const perPage = 8;

    const refreshPage = useCallback(() => {
        window.location.reload();
    }, []);

    const totalPages = useMemo(
        () => Math.max(1, Math.ceil(loans.length / perPage)),
        [loans.length, perPage]
    );
    const pagedLoans = useMemo(() => {
        const start = (page - 1) * perPage;
        return loans.slice(start, start + perPage);
    }, [loans, page, perPage]);

    useEffect(() => {
        setPage(1);
    }, [search, status, loans.length]);

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages);
        }
    }, [page, totalPages]);

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
                <div className="card p-4">
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
                <form onSubmit={handleFilterSubmit} className="card p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <label className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500">
                                Search
                            </label>
                            <input
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-dark-card"
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
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-dark-card"
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
                <div className="card p-4">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                        All loans
                    </h3>
                    <div className="mt-4 overflow-x-auto">
                        <table className="min-w-[880px] w-full text-left text-sm text-slate-600 dark:text-slate-300">
                            <thead className="text-xs uppercase text-slate-400 dark:text-slate-500">
                                <tr>
                                    <th className="py-2 pr-4">Loan</th>
                                    <th className="py-2 pr-4">Due date</th>
                                    <th className="py-2 hidden md:table-cell">
                                        Status
                                    </th>
                                    <th className="py-2 hidden md:table-cell">
                                        Progress
                                    </th>
                                    <th className="py-2 text-right whitespace-nowrap">
                                        Remaining
                                    </th>
                                    <th className="py-2 text-right whitespace-nowrap">
                                        Total
                                    </th>
                                    <th className="py-2 text-right whitespace-nowrap">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagedLoans.map((loan) => {
                                    const total = Number(loan.total_amount ?? 0);
                                    const remaining = Number(
                                        loan.remaining_amount ?? 0
                                    );
                                    const progress =
                                        total > 0
                                            ? Math.min(
                                                  100,
                                                  Math.round(
                                                      ((total - remaining) /
                                                          total) *
                                                          100
                                                  )
                                              )
                                            : 0;

                                    return (
                                        <tr
                                            key={loan.id}
                                            className="border-t border-slate-200 dark:border-slate-700"
                                        >
                                            <td className="py-3 pr-4">
                                                <p className="font-medium text-slate-800 dark:text-slate-100">
                                                    {loan.name}
                                                </p>
                                            </td>
                                            <td className="py-3 pr-4 text-xs text-slate-400">
                                                {formatDate(loan.target_date)}
                                            </td>
                                            <td className="py-3 hidden md:table-cell">
                                                <span
                                                    className={`text-xs font-semibold ${
                                                        loan.is_active
                                                            ? "text-emerald-600 dark:text-emerald-300"
                                                            : "text-slate-500 dark:text-slate-400"
                                                    }`}
                                                >
                                                    {loan.is_active
                                                        ? "Active"
                                                        : "Closed"}
                                                </span>
                                            </td>
                                            <td className="py-3 min-w-[160px] hidden md:table-cell">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-slate-400">
                                                        {progress}%
                                                    </span>
                                                    <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-dark-card/70">
                                                        <div
                                                            className="h-2 rounded-full bg-amber-500 dark:bg-amber-500/80"
                                                            style={{
                                                                width: `${progress}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 text-right font-semibold text-slate-800 dark:text-slate-100">
                                                {formatCurrency(
                                                    remaining,
                                                    loan.currency
                                                )}
                                            </td>
                                            <td className="py-3 text-right text-xs text-slate-400">
                                                {formatCurrency(
                                                    total,
                                                    loan.currency
                                                )}
                                            </td>
                                            <td className="py-3 text-right">
                                                <div className="flex flex-wrap items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setActiveLoan(
                                                                loan
                                                            )
                                                        }
                                                        className="rounded-md p-1 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-300"
                                                        title="Edit loan"
                                                        aria-label="Edit loan"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleViewTransactions(
                                                                loan
                                                            )
                                                        }
                                                        className="rounded-md p-1 text-slate-600 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                                                        title="View transactions"
                                                        aria-label="View transactions"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDelete(loan)
                                                        }
                                                        className="rounded-md p-1 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-900/20 dark:hover:text-rose-300"
                                                        title="Delete loan"
                                                        aria-label="Delete loan"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {(!pagedLoans || pagedLoans.length === 0) && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="py-6 text-center text-sm text-slate-400 dark:text-slate-500"
                                        >
                                            No loans match your filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                {loans.length > perPage && (
                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600 dark:text-slate-300">
                        <span>
                            Showing {(page - 1) * perPage + 1}-
                            {Math.min(page * perPage, loans.length)} of{" "}
                            {loans.length}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setPage((prev) => Math.max(1, prev - 1))
                                }
                                disabled={page === 1}
                                className="rounded-md border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-700 disabled:cursor-not-allowed disabled:text-slate-300 dark:border-slate-700 dark:text-slate-300 dark:hover:text-slate-100"
                            >
                                Prev
                            </button>
                            <span className="text-xs text-slate-400">
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
                                className="rounded-md border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-700 disabled:cursor-not-allowed disabled:text-slate-300 dark:border-slate-700 dark:text-slate-300 dark:hover:text-slate-100"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
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

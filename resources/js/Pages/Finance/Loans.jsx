import LoanForm from "@/Components/Finance/Loans/LoanForm";
import Modal from "@/Components/Modal";
import TodoLayout from "@/Layouts/TodoLayout";
import OnboardingTour from "@/Components/OnboardingTour";
import Badge from "@/Components/Finance/UI/Badge";
import EmptyState from "@/Components/Finance/UI/EmptyState";
import useWalletMutation from "@/Hooks/useWalletMutation";
import { formatWholeCurrency, formatCurrency } from "@/Utils/currency";
import { walletLoansSteps } from "@/tours";
import { Head, Link, router } from "@inertiajs/react";
import { Eye, Landmark, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const formatDate = (value) =>
    value ? new Date(value).toLocaleDateString() : "-";

export default function Loans({ loans = [], walletUserId, filters = {} }) {
    const mutate = useWalletMutation(walletUserId);
    const [showCreate, setShowCreate] = useState(false);
    const [activeLoan, setActiveLoan] = useState(null);
    const [search, setSearch] = useState(filters.search ?? "");
    const [status, setStatus] = useState(filters.status ?? "all");
    const [viewLoan, setViewLoan] = useState(null);
    const [relatedTransactions, setRelatedTransactions] = useState([]);
    const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
    const [page, setPage] = useState(1);
    const perPage = 8;

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

            const result = await mutate({
                request: () =>
                    window.axios.post(
                        route("weviewallet.api.loans.store"),
                        payload
                    ),
                only: ["loans"],
                successMessage: "Loan created.",
            });
            return result !== false;
        },
        [mutate, walletUserId]
    );

    const handleCreateAndClose = async (payload) => {
        const ok = await handleCreate(payload);
        if (ok !== false) {
            setShowCreate(false);
        }
        return ok;
    };

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

            const result = await mutate({
                request: () =>
                    window.axios.put(
                        `${route("weviewallet.api.loans.index")}/${formData.id}`,
                        payload
                    ),
                only: ["loans"],
                successMessage: "Loan updated.",
            });
            return result !== false;
        },
        [mutate]
    );

    const handleDelete = useCallback(
        async (loan) => {
            await mutate({
                request: () =>
                    window.axios.delete(
                        `${route("weviewallet.api.loans.index")}/${loan.id}`
                    ),
                only: ["loans"],
                successMessage: "Loan deleted.",
            });
        },
        [mutate]
    );

    return (
        <TodoLayout header="Loans">
            <Head title="Loans" />
            <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                <div className="card p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-semibold text-light-primary dark:text-dark-primary">
                                Loans
                            </h2>
                            <p className="text-sm text-light-muted dark:text-dark-muted">
                                Track every loan you are paying off.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                data-tour="loans-create"
                                onClick={() => setShowCreate(true)}
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-wevie-teal to-wevie-mint px-4 py-2 text-sm font-medium text-white shadow-soft hover:opacity-90"
                            >
                                <Plus className="h-4 w-4" />
                                New loan
                            </button>
                            <Link
                                href={route("weviewallet.dashboard", {
                                    wallet_user_id: walletUserId || undefined,
                                })}
                                className="rounded-xl border border-light-border/70 px-3 py-2 text-sm font-semibold text-light-secondary hover:bg-light-hover dark:border-dark-border/70 dark:text-dark-secondary dark:hover:bg-dark-hover"
                            >
                                Back to dashboard
                            </Link>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleFilterSubmit} className="card p-4" data-tour="loans-filters">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <label className="text-xs font-semibold uppercase text-light-muted dark:text-dark-muted">
                                Search
                            </label>
                            <input
                                className="mt-1 w-full rounded-md border border-light-border/70 px-3 py-2 text-sm text-light-primary focus:border-wevie-teal focus:outline-none focus:ring-1 focus:ring-wevie-teal/30 dark:border-dark-border/70 dark:bg-dark-card dark:text-dark-primary"
                                placeholder="Search by loan name or notes"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase text-light-muted dark:text-dark-muted">
                                Status
                            </label>
                            <select
                                className="mt-1 w-full rounded-md border border-light-border/70 px-3 py-2 text-sm text-light-primary focus:border-wevie-teal focus:outline-none focus:ring-1 focus:ring-wevie-teal/30 dark:border-dark-border/70 dark:bg-dark-card dark:text-dark-primary"
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
                                className="w-full rounded-xl bg-gradient-to-r from-wevie-teal to-wevie-mint px-3 py-2 text-sm font-medium text-white shadow-soft hover:opacity-90"
                            >
                                Apply filters
                            </button>
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="w-full rounded-xl border border-light-border/70 px-3 py-2 text-sm font-semibold text-light-secondary hover:bg-light-hover dark:border-dark-border/70 dark:text-dark-secondary dark:hover:bg-dark-hover"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </form>
                <div className="card p-4" data-tour="loans-list">
                    <h3 className="text-lg font-semibold text-light-primary dark:text-dark-primary">
                        All loans
                    </h3>
                    <div className="mt-4 overflow-x-auto">
                        <table className="min-w-[880px] w-full text-left text-sm text-light-secondary dark:text-dark-secondary">
                            <thead className="text-xs uppercase text-light-muted dark:text-dark-muted">
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
                                            className="border-t border-light-border/70 dark:border-dark-border/70"
                                        >
                                            <td className="py-3 pr-4">
                                                <p className="font-medium text-light-primary dark:text-dark-primary">
                                                    {loan.name}
                                                </p>
                                            </td>
                                            <td className="py-3 pr-4 text-xs text-light-muted dark:text-dark-muted">
                                                {formatDate(loan.target_date)}
                                            </td>
                                            <td className="py-3 hidden md:table-cell">
                                                <Badge
                                                    label={
                                                        loan.is_active
                                                            ? "Active"
                                                            : "Closed"
                                                    }
                                                    tone={
                                                        loan.is_active
                                                            ? "success"
                                                            : "neutral"
                                                    }
                                                />
                                            </td>
                                            <td className="py-3 min-w-[160px] hidden md:table-cell">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-light-muted dark:text-dark-muted">
                                                        {progress}%
                                                    </span>
                                                    <div className="h-2 w-full rounded-full bg-light-hover dark:bg-dark-hover">
                                                        <div
                                                            className="h-2 rounded-full bg-amber-500 dark:bg-amber-500/80"
                                                            style={{
                                                                width: `${progress}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 text-right font-semibold text-light-primary dark:text-dark-primary">
                                                {formatWholeCurrency(
                                                    remaining,
                                                    loan.currency
                                                )}
                                            </td>
                                            <td className="py-3 text-right text-xs text-light-muted dark:text-dark-muted">
                                                {formatWholeCurrency(
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
                                                        className="rounded-md p-1 text-wevie-teal hover:text-wevie-teal/80 dark:text-wevie-mint"
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
                                                        className="rounded-md p-1 text-light-secondary hover:text-light-primary dark:text-dark-secondary dark:hover:text-dark-primary"
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
                                                        className="rounded-md p-1 text-rose-600 hover:text-rose-700 dark:text-rose-300"
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
                                        <td colSpan={7} className="py-6">
                                            <EmptyState
                                                icon={Landmark}
                                                title="No loans yet"
                                                description="No loans match your filters. Use the New loan button to start tracking what you owe."
                                            />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                {loans.length > perPage && (
                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-light-secondary dark:text-dark-secondary">
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
                                className="rounded-xl border border-light-border/70 px-3 py-1 text-xs font-semibold text-light-secondary hover:bg-light-hover disabled:cursor-not-allowed disabled:text-light-muted dark:border-dark-border/70 dark:text-dark-secondary dark:hover:bg-dark-hover dark:disabled:text-dark-muted"
                            >
                                Prev
                            </button>
                            <span className="text-xs text-light-muted dark:text-dark-muted">
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
                                className="rounded-xl border border-light-border/70 px-3 py-1 text-xs font-semibold text-light-secondary hover:bg-light-hover disabled:cursor-not-allowed disabled:text-light-muted dark:border-dark-border/70 dark:text-dark-secondary dark:hover:bg-dark-hover dark:disabled:text-dark-muted"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <Modal
                show={showCreate}
                onClose={() => setShowCreate(false)}
                maxWidth="lg"
            >
                <div className="border-b border-light-border/70 px-6 py-4 dark:border-dark-border/70">
                    <h3 className="text-lg font-semibold text-light-primary dark:text-dark-primary">
                        Add loan
                    </h3>
                </div>
                <div className="px-6 py-4">
                    <LoanForm onSubmit={handleCreateAndClose} />
                </div>
            </Modal>

            <Modal
                show={Boolean(activeLoan)}
                onClose={() => setActiveLoan(null)}
                maxWidth="lg"
            >
                <div className="border-b border-light-border/70 px-6 py-4 dark:border-dark-border/70">
                    <h3 className="text-lg font-semibold text-light-primary dark:text-dark-primary">
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
                <div className="border-b border-light-border/70 px-6 py-4 dark:border-dark-border/70">
                    <h3 className="text-lg font-semibold text-light-primary dark:text-dark-primary">
                        {viewLoan?.name} transactions
                    </h3>
                </div>
                <div className="px-6 py-4">
                    {isLoadingTransactions ? (
                        <p className="text-sm text-light-muted dark:text-dark-muted">
                            Loading transactions...
                        </p>
                    ) : relatedTransactions.length === 0 ? (
                        <EmptyState
                            icon={Landmark}
                            title="No linked transactions"
                            description="No transactions are linked to this loan yet."
                        />
                    ) : (
                        <div className="space-y-3 text-sm text-light-secondary dark:text-dark-secondary">
                            {relatedTransactions.map((transaction) => (
                                <div
                                    key={transaction.id}
                                    className="rounded-lg border border-light-border/70 px-3 py-2 dark:border-dark-border/70"
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
                                                {formatCurrency(
                                                    transaction.amount,
                                                    transaction.currency ?? "PHP"
                                                )}
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
            <OnboardingTour
                tourKey="wallet_loans"
                steps={walletLoansSteps}
                requireCompleted={["onboarding"]}
            />
        </TodoLayout>
    );
}

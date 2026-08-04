import LoanForm from "@/Components/Finance/Loans/LoanForm";
import Modal from "@/Components/Modal";
import TodoLayout from "@/Layouts/TodoLayout";
import OnboardingTour from "@/Components/OnboardingTour";
import Badge from "@/Components/Finance/UI/Badge";
import EmptyState from "@/Components/Finance/UI/EmptyState";
import ResponsiveTable from "@/Components/Finance/UI/ResponsiveTable";
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

    const loanMetrics = (loan) => {
        const total = Number(loan.total_amount ?? 0);
        const remaining = Number(loan.remaining_amount ?? 0);
        const progress =
            total > 0
                ? Math.min(
                      100,
                      Math.round(((total - remaining) / total) * 100)
                  )
                : 0;
        return { total, remaining, progress };
    };

    const rowActions = (loan) => (
        <>
            <button
                type="button"
                onClick={() => setActiveLoan(loan)}
                className="rounded-md p-2 text-wevie-teal hover:text-wevie-teal/80 dark:text-wevie-mint"
                title="Edit loan"
                aria-label="Edit loan"
            >
                <Pencil className="h-4 w-4" />
            </button>
            <button
                type="button"
                onClick={() => handleViewTransactions(loan)}
                className="rounded-md p-2 text-light-secondary hover:text-light-primary dark:text-dark-secondary dark:hover:text-dark-primary"
                title="View transactions"
                aria-label="View transactions"
            >
                <Eye className="h-4 w-4" />
            </button>
            <button
                type="button"
                onClick={() => handleDelete(loan)}
                className="rounded-md p-2 text-rose-600 hover:text-rose-700 dark:text-rose-300"
                title="Delete loan"
                aria-label="Delete loan"
            >
                <Trash2 className="h-4 w-4" />
            </button>
        </>
    );

    const columns = [
        {
            key: "name",
            header: "Loan",
            render: (loan) => (
                <p className="font-medium text-light-primary dark:text-dark-primary">
                    {loan.name}
                </p>
            ),
        },
        {
            key: "target_date",
            header: "Due date",
            render: (loan) => (
                <span className="text-xs text-light-muted dark:text-dark-muted">
                    {formatDate(loan.target_date)}
                </span>
            ),
        },
        {
            key: "status",
            header: "Status",
            className: "hidden md:table-cell",
            cellClassName: "hidden md:table-cell",
            render: (loan) => (
                <Badge
                    label={loan.is_active ? "Active" : "Closed"}
                    tone={loan.is_active ? "success" : "neutral"}
                />
            ),
        },
        {
            key: "progress",
            header: "Progress",
            className: "hidden md:table-cell",
            cellClassName: "hidden min-w-[160px] md:table-cell",
            render: (loan) => {
                const { progress } = loanMetrics(loan);
                return (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-light-muted dark:text-dark-muted">
                            {progress}%
                        </span>
                        <div className="h-2 w-full rounded-full bg-light-hover dark:bg-dark-hover">
                            <div
                                className="h-2 rounded-full bg-amber-500 dark:bg-amber-500/80"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                );
            },
        },
        {
            key: "remaining",
            header: "Remaining",
            align: "right",
            render: (loan) => {
                const { remaining } = loanMetrics(loan);
                return (
                    <span className="font-semibold text-light-primary dark:text-dark-primary">
                        {formatWholeCurrency(remaining, loan.currency)}
                    </span>
                );
            },
        },
        {
            key: "total",
            header: "Total",
            align: "right",
            render: (loan) => {
                const { total } = loanMetrics(loan);
                return (
                    <span className="text-xs text-light-muted dark:text-dark-muted">
                        {formatWholeCurrency(total, loan.currency)}
                    </span>
                );
            },
        },
        {
            key: "actions",
            header: "Actions",
            align: "right",
            render: (loan) => (
                <div className="flex flex-wrap items-center justify-end gap-2">
                    {rowActions(loan)}
                </div>
            ),
        },
    ];

    const renderCard = (loan) => {
        const { total, remaining, progress } = loanMetrics(loan);
        return (
            <div className="rounded-xl border border-light-border/70 p-4 dark:border-dark-border/70">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="truncate font-medium text-light-primary dark:text-dark-primary">
                            {loan.name}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                            <Badge
                                label={loan.is_active ? "Active" : "Closed"}
                                tone={loan.is_active ? "success" : "neutral"}
                            />
                            <span className="text-xs text-light-muted dark:text-dark-muted">
                                {formatDate(loan.target_date)}
                            </span>
                        </div>
                    </div>
                    <p className="shrink-0 text-right font-semibold text-light-primary dark:text-dark-primary">
                        {formatWholeCurrency(remaining, loan.currency)}
                    </p>
                </div>

                <dl className="mt-3 space-y-1 text-xs text-light-muted dark:text-dark-muted">
                    <div className="flex justify-between gap-2">
                        <dt className="shrink-0">Total</dt>
                        <dd className="min-w-0 truncate text-right text-light-secondary dark:text-dark-secondary">
                            {formatWholeCurrency(total, loan.currency)}
                        </dd>
                    </div>
                </dl>

                <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs text-light-muted dark:text-dark-muted">
                        <span>Progress</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-light-hover dark:bg-dark-hover">
                        <div
                            className="h-2 rounded-full bg-amber-500 dark:bg-amber-500/80"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                <div className="mt-3 flex items-center justify-end gap-1 border-t border-light-border/50 pt-3 dark:border-dark-border/50">
                    {rowActions(loan)}
                </div>
            </div>
        );
    };

    return (
        <TodoLayout header="Loans">
            <Head title="Loans" />
            <div className="mx-auto max-w-5xl space-y-6">
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
                    <div className="mt-4">
                        <ResponsiveTable
                            columns={columns}
                            rows={pagedLoans}
                            keyField="id"
                            renderCard={renderCard}
                            emptyState={
                                <EmptyState
                                    icon={Landmark}
                                    title="No loans yet"
                                    description="No loans match your filters. Use the New loan button to start tracking what you owe."
                                />
                            }
                        />
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

import AccountForm from "@/Components/Finance/Accounts/AccountForm";
import AccountsList from "@/Components/Finance/Accounts/AccountsList";
import Modal from "@/Components/Modal";
import TodoLayout from "@/Layouts/TodoLayout";
import OnboardingTour from "@/Components/OnboardingTour";
import useWalletMutation from "@/Hooks/useWalletMutation";
import { walletAccountsSteps } from "@/tours";
import { Head, Link } from "@inertiajs/react";
import { Plus } from "lucide-react";
import { useCallback, useState } from "react";

export default function Accounts({
    accounts = [],
    accountSuggestions = {},
    walletUserId,
}) {
    const mutate = useWalletMutation(walletUserId);
    const [showCreate, setShowCreate] = useState(false);
    const [activeAccount, setActiveAccount] = useState(null);

    const buildPayload = (formData) => ({
        ...formData,
        wallet_user_id: walletUserId || undefined,
        starting_balance:
            formData.starting_balance === "" || formData.starting_balance === null
                ? null
                : Number(formData.starting_balance),
        credit_limit:
            formData.credit_limit === "" || formData.credit_limit === null
                ? null
                : Number(formData.credit_limit),
    });

    const handleCreate = useCallback(
        async (formData) => {
            const result = await mutate({
                request: () =>
                    window.axios.post(
                        route("weviewallet.api.accounts.store"),
                        buildPayload(formData)
                    ),
                only: ["accounts"],
                successMessage: "Account created.",
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

    const handleDelete = useCallback(
        async (account) => {
            await mutate({
                request: () =>
                    window.axios.delete(
                        `${route("weviewallet.api.accounts.index")}/${account.id}`
                    ),
                only: ["accounts"],
                successMessage: "Account deleted.",
            });
        },
        [mutate]
    );

    const handleEdit = useCallback(
        async (formData) => {
            if (!formData?.id) {
                return false;
            }

            const result = await mutate({
                request: () =>
                    window.axios.put(
                        `${route("weviewallet.api.accounts.index")}/${formData.id}`,
                        buildPayload(formData)
                    ),
                only: ["accounts"],
                successMessage: "Account updated.",
            });
            return result !== false;
        },
        [mutate, walletUserId]
    );

    return (
        <TodoLayout header="Accounts">
            <Head title="Accounts" />
            <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                <div className="card p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-semibold text-light-primary dark:text-dark-primary">
                                Accounts
                            </h2>
                            <p className="text-sm text-light-muted dark:text-dark-muted">
                                Add bank accounts and e-wallets to track balances.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                data-tour="accounts-create"
                                onClick={() => setShowCreate(true)}
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-wevie-teal to-wevie-mint px-4 py-2 text-sm font-medium text-white shadow-soft hover:opacity-90"
                            >
                                <Plus className="h-4 w-4" />
                                New account
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

                <div data-tour="accounts-list">
                    <AccountsList
                        accounts={accounts}
                        onEdit={(account) => setActiveAccount(account)}
                        onDelete={handleDelete}
                    />
                </div>
            </div>

            <Modal
                show={showCreate}
                onClose={() => setShowCreate(false)}
                maxWidth="lg"
            >
                <div className="border-b border-light-border/70 px-6 py-4 dark:border-dark-border/70">
                    <h3 className="text-lg font-semibold text-light-primary dark:text-dark-primary">
                        Add account
                    </h3>
                </div>
                <div className="px-6 py-4">
                    <AccountForm
                        onSubmit={handleCreateAndClose}
                        suggestionsByType={accountSuggestions}
                    />
                </div>
            </Modal>

            <Modal
                show={Boolean(activeAccount)}
                onClose={() => setActiveAccount(null)}
                maxWidth="lg"
            >
                <div className="border-b border-light-border/70 px-6 py-4 dark:border-dark-border/70">
                    <h3 className="text-lg font-semibold text-light-primary dark:text-dark-primary">
                        Edit account
                    </h3>
                </div>
                <div className="px-6 py-4">
                    <AccountForm
                        initialValues={activeAccount}
                        submitLabel="Update account"
                        suggestionsByType={accountSuggestions}
                        onSubmit={(payload) =>
                            Promise.resolve(handleEdit(payload)).finally(() =>
                                setActiveAccount(null)
                            )
                        }
                    />
                </div>
            </Modal>
            <OnboardingTour
                tourKey="wallet_accounts"
                steps={walletAccountsSteps}
                requireCompleted={["onboarding"]}
            />
        </TodoLayout>
    );
}

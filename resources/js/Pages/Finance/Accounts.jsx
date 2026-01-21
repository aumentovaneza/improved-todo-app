import AccountForm from "@/Components/Finance/Accounts/AccountForm";
import AccountsList from "@/Components/Finance/Accounts/AccountsList";
import Modal from "@/Components/Modal";
import TodoLayout from "@/Layouts/TodoLayout";
import { Head, Link } from "@inertiajs/react";
import { useCallback, useState } from "react";

export default function Accounts({
    accounts = [],
    accountSuggestions = {},
    walletUserId,
}) {
    const [activeAccount, setActiveAccount] = useState(null);
    const refreshPage = useCallback(() => {
        window.location.reload();
    }, []);

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
            await window.axios.post(
                route("weviewallet.api.accounts.store"),
                buildPayload(formData)
            );
            refreshPage();
            return true;
        },
        [refreshPage, walletUserId]
    );

    const handleDelete = useCallback(
        async (account) => {
            await window.axios.delete(
                `${route("weviewallet.api.accounts.index")}/${account.id}`
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

            await window.axios.put(
                `${route("weviewallet.api.accounts.index")}/${formData.id}`,
                buildPayload(formData)
            );
            refreshPage();
            return true;
        },
        [refreshPage, walletUserId]
    );

    return (
        <TodoLayout header="Accounts">
            <Head title="Accounts" />
            <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                <div className="card p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                                Accounts
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Add bank accounts and e-wallets to track balances.
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

                <AccountForm
                    onSubmit={handleCreate}
                    suggestionsByType={accountSuggestions}
                />
                <AccountsList
                    accounts={accounts}
                    onEdit={(account) => setActiveAccount(account)}
                    onDelete={handleDelete}
                />
            </div>

            <Modal
                show={Boolean(activeAccount)}
                onClose={() => setActiveAccount(null)}
                maxWidth="lg"
            >
                <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
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
        </TodoLayout>
    );
}

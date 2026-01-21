import AccountForm from "@/Components/Finance/Accounts/AccountForm";
import AccountsList from "@/Components/Finance/Accounts/AccountsList";
import CategoryForm from "@/Components/Finance/Categories/CategoryForm";
import CategoryList from "@/Components/Finance/Categories/CategoryList";
import Modal from "@/Components/Modal";
import TodoLayout from "@/Layouts/TodoLayout";
import { Head, Link } from "@inertiajs/react";
import { useCallback, useState } from "react";

export default function WevieWalletManagement({
    accounts = [],
    categories = [],
    accountSuggestions = {},
}) {
    const [activeAccount, setActiveAccount] = useState(null);
    const [activeTab, setActiveTab] = useState("accounts");
    const refreshPage = useCallback(() => {
        window.location.reload();
    }, []);

    const buildAccountPayload = (formData) => ({
        ...formData,
        starting_balance:
            formData.starting_balance === "" || formData.starting_balance === null
                ? null
                : Number(formData.starting_balance),
        credit_limit:
            formData.credit_limit === "" || formData.credit_limit === null
                ? null
                : Number(formData.credit_limit),
    });

    const handleCreateAccount = useCallback(
        async (formData) => {
            await window.axios.post(
                route("weviewallet.api.accounts.store"),
                buildAccountPayload(formData)
            );
            refreshPage();
            return true;
        },
        [refreshPage]
    );

    const handleEditAccount = useCallback(
        async (formData) => {
            if (!formData?.id) {
                return false;
            }

            await window.axios.put(
                `${route("weviewallet.api.accounts.index")}/${formData.id}`,
                buildAccountPayload(formData)
            );
            refreshPage();
            return true;
        },
        [refreshPage]
    );

    const handleDeleteAccount = useCallback(
        async (account) => {
            await window.axios.delete(
                `${route("weviewallet.api.accounts.index")}/${account.id}`
            );
            refreshPage();
        },
        [refreshPage]
    );

    const handleCreateCategory = useCallback(
        async (formData) => {
            const payload = {
                ...formData,
                color: formData.color || "#64748B",
                icon: formData.icon || null,
            };

            await window.axios.post(
                route("weviewallet.api.categories.store"),
                payload
            );
            refreshPage();
            return true;
        },
        [refreshPage]
    );

    const handleUpdateCategory = useCallback(
        async (category, formData) => {
            const payload = {
                ...formData,
                color: formData.color || "#64748B",
                icon: formData.icon || null,
            };

            await window.axios.put(
                `${route("weviewallet.api.categories.index")}/${category.id}`,
                payload
            );
            refreshPage();
            return true;
        },
        [refreshPage]
    );

    const handleDeleteCategory = useCallback(
        async (category) => {
            await window.axios.delete(
                `${route("weviewallet.api.categories.index")}/${category.id}`
            );
            refreshPage();
        },
        [refreshPage]
    );

    return (
        <TodoLayout header="WevieWallet Management">
            <Head title="WevieWallet Management" />
            <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                <div className="card p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                                WevieWallet management
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Manage accounts and categories in one place.
                            </p>
                        </div>
                        <Link
                            href={route("profile.edit")}
                            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-300 dark:hover:text-indigo-200"
                        >
                            Back to profile
                        </Link>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 border-b border-slate-200 text-sm dark:border-white/10">
                        <button
                            type="button"
                            onClick={() => setActiveTab("accounts")}
                            className={`-mb-px rounded-t-md border border-b-0 px-4 py-2 font-semibold ${
                                activeTab === "accounts"
                                    ? "border-light-border/70 bg-white text-slate-900 dark:border-white/10 dark:bg-dark-card dark:text-white"
                                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                            }`}
                        >
                            Accounts
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("categories")}
                            className={`-mb-px rounded-t-md border border-b-0 px-4 py-2 font-semibold ${
                                activeTab === "categories"
                                    ? "border-light-border/70 bg-white text-slate-900 dark:border-white/10 dark:bg-dark-card dark:text-white"
                                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                            }`}
                        >
                            Categories
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    {activeTab === "accounts" && (
                        <section className="card p-4 space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                    Accounts
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Manage bank accounts, e-wallets, and credit cards.
                                </p>
                            </div>
                            <AccountForm
                                onSubmit={handleCreateAccount}
                                suggestionsByType={accountSuggestions}
                            />
                            <AccountsList
                                accounts={accounts}
                                onEdit={(account) => setActiveAccount(account)}
                                onDelete={handleDeleteAccount}
                            />
                        </section>
                    )}
                    {activeTab === "categories" && (
                        <section className="card p-4 space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                    Categories
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Organize income, expenses, savings, and loans.
                                </p>
                            </div>
                            <CategoryForm onSubmit={handleCreateCategory} />
                            <CategoryList
                                categories={categories}
                                onUpdate={handleUpdateCategory}
                                onDelete={handleDeleteCategory}
                            />
                        </section>
                    )}
                </div>
            </div>

            <Modal
                show={Boolean(activeAccount)}
                onClose={() => setActiveAccount(null)}
                maxWidth="lg"
            >
                <div className="border-b border-slate-200 px-6 py-4 dark:border-white/10">
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
                            Promise.resolve(handleEditAccount(payload)).finally(
                                () => setActiveAccount(null)
                            )
                        }
                    />
                </div>
            </Modal>
        </TodoLayout>
    );
}

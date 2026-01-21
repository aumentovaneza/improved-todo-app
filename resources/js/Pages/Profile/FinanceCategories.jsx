import CategoryForm from "@/Components/Finance/Categories/CategoryForm";
import CategoryList from "@/Components/Finance/Categories/CategoryList";
import TodoLayout from "@/Layouts/TodoLayout";
import { Head, Link } from "@inertiajs/react";
import { useCallback } from "react";

export default function FinanceCategories({ categories = [], walletUserId }) {
    const refreshPage = useCallback(() => {
        window.location.reload();
    }, []);

    const handleCreate = useCallback(
        async (formData) => {
            const payload = {
                ...formData,
                wallet_user_id: walletUserId || undefined,
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
        [refreshPage, walletUserId]
    );

    const handleUpdate = useCallback(
        async (category, formData) => {
            const payload = {
                ...formData,
                wallet_user_id: walletUserId || undefined,
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
        [refreshPage, walletUserId]
    );

    const handleDelete = useCallback(
        async (category) => {
            await window.axios.delete(
                `${route("weviewallet.api.categories.index")}/${category.id}`
            );
            refreshPage();
        },
        [refreshPage]
    );

    return (
        <TodoLayout header="WevieWallet Categories">
            <Head title="WevieWallet Categories" />
            <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                <div className="card p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                                Finance categories
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Manage income, expense, and savings categories.
                            </p>
                        </div>
                        <Link
                            href={route("weviewallet.dashboard", {
                                wallet_user_id: walletUserId || undefined,
                            })}
                            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                        >
                            Back to WevieWallet
                        </Link>
                    </div>
                </div>

                <CategoryForm onSubmit={handleCreate} />
                <CategoryList
                    categories={categories}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                />
            </div>
        </TodoLayout>
    );
}

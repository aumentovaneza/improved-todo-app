import EmptyState from "@/Components/Finance/UI/EmptyState";
import StatCard from "@/Components/Finance/UI/StatCard";
import Tabs from "@/Components/Finance/UI/Tabs";
import StoreItemCard from "@/Components/Store/StoreItemCard";
import TodoLayout from "@/Layouts/TodoLayout";
import { Head } from "@inertiajs/react";
import { ShoppingBag, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

export default function Index({ items = [], balance = 0 }) {
    const [tab, setTab] = useState("avatars");

    const tabs = [
        { value: "avatars", label: "Avatars" },
        { value: "accessories", label: "Accessories · Coming soon" },
    ];

    // Phase 1 backend only sends avatar bases, but filter defensively so a
    // future accessory drop doesn't leak into the Avatars tab.
    const avatarItems = useMemo(
        () => items.filter((item) => item.type === "avatar_base" || !item.type),
        [items]
    );

    return (
        <TodoLayout header="Store">
            <Head title="Store" />

            <div className="space-y-6">
                {/* Balance header */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    <StatCard
                        label="Your points"
                        value={balance.toLocaleString()}
                        icon={Sparkles}
                        iconClassName="bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300"
                        accent="text-primary-600 dark:text-primary-300"
                        hint="Earn more by completing tasks and focus sessions"
                    />
                </div>

                {/* Section tabs */}
                <Tabs
                    tabs={tabs}
                    active={tab}
                    onChange={(value) => {
                        // Accessories are not purchasable in Phase 1.
                        if (value === "accessories") return;
                        setTab(value);
                    }}
                />

                {tab === "avatars" && (
                    <>
                        {avatarItems.length === 0 ? (
                            <EmptyState
                                icon={ShoppingBag}
                                title="No avatars available yet"
                                description="Check back soon — new avatars are on the way."
                            />
                        ) : (
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                                {avatarItems.map((item) => (
                                    <StoreItemCard
                                        key={item.id}
                                        item={item}
                                        balance={balance}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </TodoLayout>
    );
}

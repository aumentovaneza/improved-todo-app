import Avatar from "@/Components/Avatar/Avatar";
import PurchaseButton from "@/Components/Store/PurchaseButton";
import { router } from "@inertiajs/react";
import { Check, Sparkles } from "lucide-react";
import { useState } from "react";

/**
 * A single catalog card: avatar preview, name, description, cost, and a
 * state-aware action — Equipped (owned + active), Equip (owned), or Buy.
 */
export default function StoreItemCard({ item, balance = 0 }) {
    const [equipping, setEquipping] = useState(false);
    const canAfford = balance >= item.cost;

    const handleEquip = () => {
        setEquipping(true);
        router.post(
            route("store.equip"),
            { store_item_id: item.id },
            {
                preserveScroll: true,
                onFinish: () => setEquipping(false),
            }
        );
    };

    return (
        <div className="card flex flex-col p-4">
            <div className="flex justify-center py-2">
                <Avatar
                    avatar={{
                        base_url: item.preview_url,
                        initials: item.name?.[0] ?? "?",
                    }}
                    size="lg"
                />
            </div>

            <h3 className="mt-3 truncate text-sm font-semibold text-light-primary dark:text-dark-primary">
                {item.name}
            </h3>
            {item.description && (
                <p className="mt-1 line-clamp-2 text-xs text-light-muted dark:text-dark-muted">
                    {item.description}
                </p>
            )}

            <div className="mt-auto pt-3">
                <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-primary-600 dark:text-primary-300">
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    <span>{item.cost}</span>
                </div>

                {item.equipped ? (
                    <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary-100 px-3 py-2 text-sm font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-200">
                        <Check className="h-4 w-4" aria-hidden="true" />
                        Equipped
                    </span>
                ) : item.owned ? (
                    <button
                        type="button"
                        onClick={handleEquip}
                        disabled={equipping}
                        className="inline-flex w-full items-center justify-center rounded-lg border border-light-border px-3 py-2 text-sm font-medium text-light-primary transition-colors hover:bg-light-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-border dark:text-dark-primary dark:hover:bg-dark-hover"
                    >
                        {equipping ? "Equipping…" : "Equip"}
                    </button>
                ) : (
                    <>
                        <PurchaseButton item={item} disabled={!canAfford} />
                        {!canAfford && (
                            <p className="mt-1.5 text-center text-xs text-light-muted dark:text-dark-muted">
                                Not enough points
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

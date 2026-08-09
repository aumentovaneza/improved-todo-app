import { fireConfetti } from "@/lib/confetti";
import { router } from "@inertiajs/react";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

/**
 * A tiny, collision-resistant id. Prefers the platform UUID generator and
 * falls back gracefully in non-secure contexts where it may be unavailable.
 */
function newRequestId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Confirm → purchase flow for a store item. The purchase is server-authoritative:
 * on success Inertia re-renders with fresh balance/owned/equipped state, so we
 * only celebrate here. Errors (e.g. insufficient balance) come back as
 * `flash.error` and are surfaced by the global FlashToaster — no extra handling.
 */
export default function PurchaseButton({ item, disabled = false, className = "" }) {
    const [processing, setProcessing] = useState(false);

    const handleBuy = async () => {
        const result = await Swal.fire({
            title: `Buy ${item.name}?`,
            text: `This will cost ${item.cost} points.`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Buy",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#4ACF91",
            cancelButtonColor: "#6B7280",
        });

        if (!result.isConfirmed) {
            return;
        }

        setProcessing(true);
        router.post(
            route("store.purchase"),
            { store_item_id: item.id, client_request_id: newRequestId() },
            {
                preserveScroll: true,
                onSuccess: () => {
                    fireConfetti();
                    toast.success(`${item.name} unlocked!`);
                },
                onFinish: () => setProcessing(false),
            }
        );
    };

    const isDisabled = disabled || processing;

    return (
        <button
            type="button"
            onClick={handleBuy}
            disabled={isDisabled}
            className={`inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary-400 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/50 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-primary-500 dark:hover:bg-primary-600 ${className}`}
        >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {processing ? "Buying…" : `Buy · ${item.cost}`}
        </button>
    );
}

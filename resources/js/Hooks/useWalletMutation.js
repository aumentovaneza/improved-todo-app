import { router } from "@inertiajs/react";
import { useCallback } from "react";
import { toast } from "react-toastify";

/**
 * Canonical WevieWallet mutation helper.
 *
 * Runs an async request (typically a window.axios call to a weviewallet.api.*
 * endpoint), then triggers an Inertia v2 partial reload of only the affected
 * props so the page updates instantly — no window.location.reload(), no
 * full-screen "Refreshing…" overlay, scroll + modal state preserved.
 *
 * The `only` keys must match the props returned by the current page's
 * controller (e.g. summary, transactions, budgets, charts, ...). The active
 * wallet id is always forwarded so the reload stays scoped to the same wallet.
 *
 * Usage:
 *   const mutate = useWalletMutation(walletUserId);
 *   await mutate({
 *       request: () => window.axios.post(url, payload),
 *       only: ["summary", "transactions", "charts", "accounts"],
 *       successMessage: "Transaction saved.",
 *   });
 *
 * Returns the request response on success, or `false` on failure.
 */
export default function useWalletMutation(walletUserId = null) {
    return useCallback(
        async ({
            request,
            only = [],
            successMessage,
            errorMessage = "Something went wrong. Please try again.",
            onSuccess,
            onError,
        }) => {
            try {
                const response = await request();

                if (only.length > 0) {
                    router.reload({
                        only,
                        data: walletUserId ? { wallet_user_id: walletUserId } : {},
                        preserveScroll: true,
                        preserveState: true,
                    });
                }

                if (successMessage) {
                    toast.success(successMessage);
                }

                onSuccess?.(response);
                return response;
            } catch (error) {
                const message =
                    error?.response?.data?.message || error?.response?.data?.error || errorMessage;
                toast.error(message);
                onError?.(error);
                return false;
            }
        },
        [walletUserId]
    );
}

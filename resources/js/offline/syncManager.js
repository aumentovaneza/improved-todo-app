import { cleanupSynced, listQueue, updateQueueItem } from "./queue";

const SYNC_TYPE = "transaction:create";
const MAX_BACKOFF_MS = 5 * 60 * 1000;
const BASE_BACKOFF_MS = 3000;

const getBackoffMs = (attempts = 0) => {
    const next = BASE_BACKOFF_MS * Math.pow(2, Math.max(0, attempts - 1));
    return Math.min(MAX_BACKOFF_MS, next);
};

const submitTransaction = async (payload) => {
    if (!window?.axios) {
        throw new Error("No network client");
    }
    const url = route("weviewallet.api.transactions.store");
    return window.axios.post(url, payload);
};

export const syncQueuedTransactions = async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
        return;
    }

    const items = await listQueue();
    const now = Date.now();

    for (const item of items) {
        if (item.type !== SYNC_TYPE) {
            continue;
        }
        if (item.status === "processing") {
            continue;
        }
        if (item.nextAttemptAt) {
            const nextAttempt = new Date(item.nextAttemptAt).getTime();
            if (Number.isFinite(nextAttempt) && nextAttempt > now) {
                continue;
            }
        }

        await updateQueueItem(item.id, {
            status: "processing",
            lastAttemptAt: new Date().toISOString(),
        });

        try {
            await submitTransaction(item.payload);
            await updateQueueItem(item.id, {
                status: "synced",
                syncedAt: new Date().toISOString(),
                lastError: null,
            });
        } catch (error) {
            const attempts = (item.attempts ?? 0) + 1;
            const nextAttemptAt = new Date(
                Date.now() + getBackoffMs(attempts)
            ).toISOString();
            await updateQueueItem(item.id, {
                status: "failed",
                attempts,
                nextAttemptAt,
                lastError: error?.message ?? "Sync failed",
            });
        }
    }

    await cleanupSynced(7 * 24 * 60 * 60 * 1000);
};

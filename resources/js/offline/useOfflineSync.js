import { useCallback, useEffect, useMemo, useState } from "react";
import {
    enqueueItem,
    listQueue,
    listenQueueChange,
    removeQueueItem,
    updateQueueItem,
} from "./queue";
import { syncQueuedTransactions } from "./syncManager";

const SYNC_TYPE = "transaction:create";

const buildId = () => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `wevie-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const useOfflineSync = () => {
    const [isOnline, setIsOnline] = useState(
        typeof navigator !== "undefined" ? navigator.onLine : true
    );
    const [queueItems, setQueueItems] = useState([]);

    const refreshQueue = useCallback(() => {
        listQueue().then(setQueueItems);
    }, []);

    useEffect(() => {
        refreshQueue();
        const unsubscribe = listenQueueChange(refreshQueue);
        return unsubscribe;
    }, [refreshQueue]);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);
        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    useEffect(() => {
        if (!isOnline) {
            return;
        }
        syncQueuedTransactions();
        const interval = window.setInterval(() => {
            syncQueuedTransactions();
        }, 30000);
        return () => window.clearInterval(interval);
    }, [isOnline]);

    const enqueueTransaction = useCallback(async (payload) => {
        const clientRequestId = payload.client_request_id || buildId();
        const item = {
            id: clientRequestId,
            type: SYNC_TYPE,
            payload: { ...payload, client_request_id: clientRequestId },
            createdAt: new Date().toISOString(),
            status: "pending",
            attempts: 0,
            nextAttemptAt: new Date().toISOString(),
        };
        await enqueueItem(item);
        if (isOnline) {
            syncQueuedTransactions();
        }
        return item;
    }, [isOnline]);

    const retryItem = useCallback(async (id) => {
        await updateQueueItem(id, {
            status: "pending",
            nextAttemptAt: new Date().toISOString(),
        });
        if (isOnline) {
            syncQueuedTransactions();
        }
    }, [isOnline]);

    const removeItem = useCallback(async (id) => {
        await removeQueueItem(id);
    }, []);

    const pendingCount = useMemo(
        () =>
            queueItems.filter((item) =>
                ["pending", "failed", "processing"].includes(item.status)
            ).length,
        [queueItems]
    );

    return {
        isOnline,
        queueItems,
        pendingCount,
        enqueueTransaction,
        retryItem,
        removeItem,
        syncNow: syncQueuedTransactions,
    };
};

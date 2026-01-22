import { idbDelete, idbGet, idbGetAll, idbPut } from "./db";

const QUEUE_EVENT = "offline-queue-updated";

const emitQueueChange = () => {
    if (typeof window === "undefined") {
        return;
    }
    window.dispatchEvent(new CustomEvent(QUEUE_EVENT));
};

const safeParse = (value, fallback) => {
    try {
        return JSON.parse(value);
    } catch (error) {
        return fallback;
    }
};

const lsKey = "wevie_offline_queue_fallback";

const fallbackRead = () => {
    if (typeof window === "undefined") {
        return [];
    }
    const raw = window.localStorage.getItem(lsKey);
    return safeParse(raw, []);
};

const fallbackWrite = (items) => {
    if (typeof window === "undefined") {
        return;
    }
    window.localStorage.setItem(lsKey, JSON.stringify(items));
};

export const listenQueueChange = (handler) => {
    if (typeof window === "undefined") {
        return () => {};
    }
    window.addEventListener(QUEUE_EVENT, handler);
    return () => window.removeEventListener(QUEUE_EVENT, handler);
};

export const listQueue = async () => {
    try {
        const items = await idbGetAll();
        return items.sort(
            (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
        );
    } catch (error) {
        return fallbackRead();
    }
};

export const enqueueItem = async (item) => {
    try {
        await idbPut(item);
    } catch (error) {
        const items = fallbackRead().filter((entry) => entry.id !== item.id);
        items.push(item);
        fallbackWrite(items);
    }
    emitQueueChange();
    return item;
};

export const getQueueItem = async (id) => {
    try {
        return await idbGet(id);
    } catch (error) {
        return fallbackRead().find((entry) => entry.id === id) ?? null;
    }
};

export const updateQueueItem = async (id, patch) => {
    const existing = await getQueueItem(id);
    if (!existing) {
        return null;
    }
    const updated = { ...existing, ...patch };
    await enqueueItem(updated);
    return updated;
};

export const removeQueueItem = async (id) => {
    try {
        await idbDelete(id);
    } catch (error) {
        const items = fallbackRead().filter((entry) => entry.id !== id);
        fallbackWrite(items);
    }
    emitQueueChange();
};

export const cleanupSynced = async (maxAgeMs) => {
    const items = await listQueue();
    const cutoff = Date.now() - maxAgeMs;
    await Promise.all(
        items
            .filter(
                (item) =>
                    item.status === "synced" &&
                    new Date(item.syncedAt ?? item.createdAt).getTime() <
                        cutoff
            )
            .map((item) => removeQueueItem(item.id))
    );
};

import Modal from "@/Components/Modal";

const statusStyles = {
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200",
    processing: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-200",
    failed: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200",
    synced: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200",
};

const formatDate = (value) =>
    value ? new Date(value).toLocaleString() : "-";

export default function SyncQueueModal({
    show,
    onClose,
    items = [],
    onRetry,
    onRemove,
    onSyncNow,
    isOnline,
}) {
    return (
        <Modal show={show} onClose={onClose} maxWidth="lg">
            <div className="border-b border-light-border/70 px-5 py-4 dark:border-dark-border/70">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-light-primary dark:text-dark-primary">
                            Sync queue
                        </h2>
                        <p className="mt-1 text-xs text-light-muted dark:text-dark-muted">
                            Pending transactions will sync when you're back online.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onSyncNow}
                        className="rounded-xl border border-light-border/70 px-3 py-1.5 text-xs font-semibold text-light-secondary hover:text-light-primary dark:border-dark-border/70 dark:text-dark-secondary dark:hover:text-dark-primary"
                        disabled={!isOnline}
                    >
                        Sync now
                    </button>
                </div>
            </div>
            <div className="px-5 py-5">
                {items.length === 0 && (
                    <p className="text-sm text-light-muted dark:text-dark-muted">
                        No queued items.
                    </p>
                )}
                <div className="space-y-3">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="rounded-xl border border-light-border/70 px-4 py-3 text-sm dark:border-dark-border/70"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-light-primary dark:text-dark-primary">
                                        {item.payload?.description || "Transaction"}
                                    </p>
                                    <p className="text-xs text-light-muted dark:text-dark-muted">
                                        {formatDate(item.createdAt)}
                                    </p>
                                </div>
                                <span
                                    className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                                        statusStyles[item.status] ||
                                        "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                    }`}
                                >
                                    {item.status}
                                </span>
                            </div>
                            {item.lastError && (
                                <p className="mt-2 text-xs text-rose-500 dark:text-rose-300">
                                    {item.lastError}
                                </p>
                            )}
                            <div className="mt-3 flex items-center gap-2">
                                {item.status !== "synced" && (
                                    <button
                                        type="button"
                                        onClick={() => onRetry?.(item.id)}
                                        className="rounded-lg border border-light-border/70 px-2 py-1 text-xs font-semibold text-light-secondary hover:text-light-primary dark:border-dark-border/70 dark:text-dark-secondary dark:hover:text-dark-primary"
                                        disabled={!isOnline}
                                    >
                                        Retry
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => onRemove?.(item.id)}
                                    className="rounded-lg px-2 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-300 dark:hover:text-rose-200"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Modal>
    );
}

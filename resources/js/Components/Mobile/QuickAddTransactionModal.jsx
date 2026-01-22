import Modal from "@/Components/Modal";
import { Link } from "@inertiajs/react";
import { useState } from "react";

export default function QuickAddTransactionModal({
    show,
    onClose,
    isOnline,
    onEnqueue,
}) {
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");

    const handleSaveOffline = async (event) => {
        event.preventDefault();
        if (!amount || !description) {
            return;
        }
        await onEnqueue?.({
            type: "expense",
            amount: Number(amount),
            description,
            occurred_at: new Date().toISOString().slice(0, 10),
        });
        setAmount("");
        setDescription("");
        onClose?.();
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <div className="border-b border-light-border/70 px-5 py-4 dark:border-dark-border/70">
                <h2 className="text-base font-semibold text-light-primary dark:text-dark-primary">
                    Quick add transaction
                </h2>
                <p className="mt-1 text-sm text-light-muted dark:text-dark-muted">
                    Capture the essentials now, refine later.
                </p>
            </div>
            <form className="space-y-4 px-5 py-5" onSubmit={handleSaveOffline}>
                <div className="space-y-2">
                    <label
                        className="text-xs font-semibold text-light-muted dark:text-dark-muted"
                        htmlFor="quick-amount"
                    >
                        Amount
                    </label>
                    <input
                        id="quick-amount"
                        type="number"
                        inputMode="decimal"
                        placeholder="0.00"
                        className="w-full rounded-xl border border-light-border/70 px-3 py-2 text-sm focus:border-wevie-teal focus:outline-none focus:ring-1 focus:ring-wevie-teal/30 dark:border-dark-border/70 dark:bg-dark-card dark:text-dark-primary"
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                        min="0"
                        step="0.01"
                        required={!isOnline}
                        autoFocus
                    />
                </div>
                <div className="space-y-2">
                    <label
                        className="text-xs font-semibold text-light-muted dark:text-dark-muted"
                        htmlFor="quick-description"
                    >
                        Description
                    </label>
                    <input
                        id="quick-description"
                        type="text"
                        placeholder="Groceries, coffee, transfer..."
                        className="w-full rounded-xl border border-light-border/70 px-3 py-2 text-sm focus:border-wevie-teal focus:outline-none focus:ring-1 focus:ring-wevie-teal/30 dark:border-dark-border/70 dark:bg-dark-card dark:text-dark-primary"
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        required={!isOnline}
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        className="rounded-xl border border-light-border/70 px-3 py-2 text-sm font-semibold text-light-secondary hover:text-light-primary dark:border-dark-border/70 dark:text-dark-secondary dark:hover:text-dark-primary"
                        onClick={onClose}
                    >
                        Not now
                    </button>
                    {isOnline ? (
                        <Link
                            href={route("weviewallet.transactions.index")}
                            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-wevie-teal to-wevie-mint px-3 py-2 text-sm font-semibold text-white shadow-soft hover:opacity-90"
                        >
                            Open full form
                        </Link>
                    ) : (
                        <button
                            type="submit"
                            className="rounded-xl bg-gradient-to-r from-wevie-teal to-wevie-mint px-3 py-2 text-sm font-semibold text-white shadow-soft hover:opacity-90"
                        >
                            Save offline
                        </button>
                    )}
                </div>
                <p className="text-xs text-light-muted dark:text-dark-muted">
                    {isOnline
                        ? "Use the full form for categories, tags, and budgets."
                        : "We'll sync it automatically when you're back online."}
                </p>
            </form>
        </Modal>
    );
}

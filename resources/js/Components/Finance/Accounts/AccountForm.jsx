import { useEffect, useMemo, useState } from "react";

const buildInitialState = (initialValues) => ({
    id: initialValues?.id,
    name: initialValues?.name ?? "",
    label: initialValues?.label ?? "",
    account_number: initialValues?.account_number ?? "",
    type: initialValues?.type ?? "bank",
    starting_balance:
        initialValues?.starting_balance !== undefined
            ? initialValues.starting_balance
            : "",
    credit_limit:
        initialValues?.credit_limit !== undefined
            ? initialValues.credit_limit
            : "",
    currency: initialValues?.currency ?? "PHP",
    notes: initialValues?.notes ?? "",
    is_active:
        initialValues?.is_active !== undefined ? initialValues.is_active : true,
});

export default function AccountForm({
    onSubmit,
    initialValues,
    suggestionsByType = {},
    submitLabel = "Save account",
}) {
    const [form, setForm] = useState(buildInitialState(initialValues));
    const [isSubmitting, setIsSubmitting] = useState(false);
    const accountSuggestions =
        suggestionsByType[form.type] ?? suggestionsByType.bank ?? [];

    useEffect(() => {
        setForm(buildInitialState(initialValues));
    }, [initialValues]);

    const updateField = (field) => (event) => {
        const value =
            field === "is_active" ? event.target.checked : event.target.value;
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        Promise.resolve(onSubmit?.(form)).finally(() => {
            setIsSubmitting(false);
            if (!initialValues) {
                setForm(buildInitialState());
            }
        });
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
        >
            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <label className="text-sm text-slate-500">
                        Account label
                    </label>
                    <input
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                        value={form.label}
                        onChange={updateField("label")}
                        placeholder="Salary account, Daily wallet"
                    />
                </div>
                <div>
                    <label className="text-sm text-slate-500">Type</label>
                    <div className="relative mt-1">
                        <select
                            className="w-full appearance-none rounded-md border border-slate-300 bg-white px-3 py-2 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                            value={form.type}
                            onChange={updateField("type")}
                        >
                            <option value="bank">Bank</option>
                            <option value="e-wallet">E-wallet</option>
                            <option value="credit-card">Credit card</option>
                        </select>
                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path d="M5.25 7.5L10 12.25L14.75 7.5H5.25Z" />
                            </svg>
                        </span>
                    </div>
                </div>
                <div>
                    <label className="text-sm text-slate-500">
                        Institution
                    </label>
                    <div className="relative mt-1">
                        <select
                            className="w-full appearance-none rounded-md border border-slate-300 bg-white px-3 py-2 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                            value={form.name}
                            onChange={updateField("name")}
                            required
                        >
                            <option value="">Select an institution</option>
                            {accountSuggestions.map((name) => (
                                <option key={name} value={name}>
                                    {name}
                                </option>
                            ))}
                        </select>
                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path d="M5.25 7.5L10 12.25L14.75 7.5H5.25Z" />
                            </svg>
                        </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                        Philippine institutions are suggested for now.
                    </p>
                </div>
                <div>
                    <label className="text-sm text-slate-500">
                        {form.type === "credit-card"
                            ? "Card number"
                            : "Account number"}
                    </label>
                    <input
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                        value={form.account_number}
                        onChange={updateField("account_number")}
                        placeholder={
                            form.type === "credit-card"
                                ? "Card number"
                                : "Account number"
                        }
                    />
                </div>
                {form.type !== "credit-card" && (
                    <div>
                        <label className="text-sm text-slate-500">
                            Starting balance
                        </label>
                        <input
                            type="number"
                            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                            value={form.starting_balance}
                            onChange={updateField("starting_balance")}
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                        />
                    </div>
                )}
                {form.type === "credit-card" && (
                    <div>
                        <label className="text-sm text-slate-500">
                            Credit limit
                        </label>
                        <input
                            type="number"
                            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                            value={form.credit_limit}
                            onChange={updateField("credit_limit")}
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                        />
                    </div>
                )}
                <div>
                    <label className="text-sm text-slate-500">Currency</label>
                    <input
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                        value={form.currency}
                        onChange={updateField("currency")}
                        placeholder="PHP"
                    />
                </div>
                <div className="sm:col-span-2">
                    <label className="text-sm text-slate-500">Notes</label>
                    <textarea
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                        rows={2}
                        value={form.notes}
                        onChange={updateField("notes")}
                        placeholder="Optional notes about this account."
                    />
                </div>
                <div className="flex items-center gap-2">
                    <input
                        id="account_is_active"
                        type="checkbox"
                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                        checked={form.is_active}
                        onChange={updateField("is_active")}
                    />
                    <label
                        htmlFor="account_is_active"
                        className="text-sm text-slate-500"
                    >
                        Active account
                    </label>
                </div>
            </div>
            <div className="mt-4 flex justify-end">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white shadow hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
                >
                    {isSubmitting ? "Saving..." : submitLabel}
                </button>
            </div>
        </form>
    );
}

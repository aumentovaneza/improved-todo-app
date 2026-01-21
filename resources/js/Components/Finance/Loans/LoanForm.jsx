import { useEffect, useState } from "react";

const buildInitialState = (initialValues) => ({
    id: initialValues?.id,
    name: initialValues?.name ?? "",
    total_amount: initialValues?.total_amount ?? "",
    remaining_amount: initialValues?.remaining_amount ?? "",
    currency: initialValues?.currency ?? "PHP",
    target_date: initialValues?.target_date
        ? initialValues.target_date.slice(0, 10)
        : "",
    notes: initialValues?.notes ?? "",
});

export default function LoanForm({
    onSubmit,
    initialValues,
    submitLabel = "Save loan",
}) {
    const [form, setForm] = useState(buildInitialState(initialValues));
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setForm(buildInitialState(initialValues));
    }, [initialValues]);

    const updateField = (field) => (event) => {
        setForm((prev) => ({ ...prev, [field]: event.target.value }));
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
        <form onSubmit={handleSubmit} className="card p-4">
            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400">
                        Loan name
                    </label>
                    <input
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-dark-card"
                        value={form.name}
                        onChange={updateField("name")}
                        placeholder="Car loan"
                        required
                    />
                </div>
                <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400">
                        Total amount
                    </label>
                    <input
                        type="number"
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-dark-card"
                        value={form.total_amount}
                        onChange={updateField("total_amount")}
                        min="0"
                        step="0.01"
                        required
                    />
                </div>
                <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400">
                        Remaining amount
                    </label>
                    <input
                        type="number"
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-dark-card"
                        value={form.remaining_amount}
                        onChange={updateField("remaining_amount")}
                        min="0"
                        step="0.01"
                    />
                </div>
                <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400">
                        Due date
                    </label>
                    <input
                        type="date"
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-dark-card"
                        value={form.target_date}
                        onChange={updateField("target_date")}
                    />
                </div>
                <div className="sm:col-span-2">
                    <label className="text-sm text-slate-500 dark:text-slate-400">
                        Notes
                    </label>
                    <textarea
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-dark-card"
                        rows={2}
                        value={form.notes}
                        onChange={updateField("notes")}
                        placeholder="Payment schedule, lender, terms"
                    />
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

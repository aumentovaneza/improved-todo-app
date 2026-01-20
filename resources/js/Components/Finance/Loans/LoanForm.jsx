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
        <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
        >
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {initialValues ? "Edit loan" : "Add loan"}
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                    <label className="text-sm text-slate-500">Loan name</label>
                    <input
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                        value={form.name}
                        onChange={updateField("name")}
                        placeholder="Car loan"
                        required
                    />
                </div>
                <div>
                    <label className="text-sm text-slate-500">
                        Total amount
                    </label>
                    <input
                        type="number"
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                        value={form.total_amount}
                        onChange={updateField("total_amount")}
                        min="0"
                        step="0.01"
                        required
                    />
                </div>
                <div>
                    <label className="text-sm text-slate-500">
                        Remaining amount
                    </label>
                    <input
                        type="number"
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                        value={form.remaining_amount}
                        onChange={updateField("remaining_amount")}
                        min="0"
                        step="0.01"
                    />
                </div>
                <div>
                    <label className="text-sm text-slate-500">Due date</label>
                    <input
                        type="date"
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                        value={form.target_date}
                        onChange={updateField("target_date")}
                    />
                </div>
                <div className="sm:col-span-2">
                    <label className="text-sm text-slate-500">Notes</label>
                    <textarea
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
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

import { useState } from "react";

export default function SavingsGoalForm({ onSubmit }) {
    const [form, setForm] = useState({
        name: "",
        target_amount: "",
        current_amount: "",
        currency: "PHP",
        target_date: "",
        notes: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const updateField = (field) => (event) => {
        setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        Promise.resolve(onSubmit?.(form)).finally(() => {
            setIsSubmitting(false);
            setForm({
                name: "",
                target_amount: "",
                current_amount: "",
                currency: "PHP",
                target_date: "",
                notes: "",
            });
        });
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
        >
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                Add savings goal
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                    <label className="text-sm text-slate-500">Name</label>
                    <input
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                        value={form.name}
                        onChange={updateField("name")}
                        placeholder="Emergency fund"
                        required
                    />
                </div>
                <div>
                    <label className="text-sm text-slate-500">
                        Target amount
                    </label>
                    <input
                        type="number"
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                        value={form.target_amount}
                        onChange={updateField("target_amount")}
                        min="0"
                        step="0.01"
                        required
                    />
                </div>
                <div>
                    <label className="text-sm text-slate-500">
                        Current amount
                    </label>
                    <input
                        type="number"
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                        value={form.current_amount}
                        onChange={updateField("current_amount")}
                        min="0"
                        step="0.01"
                    />
                </div>
                <div>
                    <label className="text-sm text-slate-500">
                        Target date
                    </label>
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
                        placeholder="What is this goal for?"
                    />
                </div>
            </div>
            <div className="mt-4 flex justify-end">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white shadow hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
                >
                    {isSubmitting ? "Saving..." : "Save goal"}
                </button>
            </div>
        </form>
    );
}

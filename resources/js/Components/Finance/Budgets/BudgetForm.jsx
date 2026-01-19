import { useState } from "react";

export default function BudgetForm({ categories = [], onSubmit }) {
    const [form, setForm] = useState({
        name: "",
        amount: "",
        currency: "PHP",
        period: "monthly",
        starts_on: "",
        ends_on: "",
        finance_category_id: "",
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
                amount: "",
                currency: "PHP",
                period: "monthly",
                starts_on: "",
                ends_on: "",
                finance_category_id: "",
            });
        });
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
        >
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                Add budget
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                    <label className="text-sm text-slate-500">Name</label>
                    <input
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                        value={form.name}
                        onChange={updateField("name")}
                        placeholder="Groceries budget"
                        required
                    />
                </div>
                <div>
                    <label className="text-sm text-slate-500">Amount</label>
                    <input
                        type="number"
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                        value={form.amount}
                        onChange={updateField("amount")}
                        min="0"
                        step="0.01"
                        required
                    />
                </div>
                <div>
                    <label className="text-sm text-slate-500">Period</label>
                    <select
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                        value={form.period}
                        onChange={updateField("period")}
                    >
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                    </select>
                </div>
                <div>
                    <label className="text-sm text-slate-500">Category</label>
                    <select
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                        value={form.finance_category_id}
                        onChange={updateField("finance_category_id")}
                    >
                        <option value="">All categories</option>
                        {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="text-sm text-slate-500">Start date</label>
                    <input
                        type="date"
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                        value={form.starts_on}
                        onChange={updateField("starts_on")}
                        required
                    />
                </div>
                <div>
                    <label className="text-sm text-slate-500">
                        End date (optional)
                    </label>
                    <input
                        type="date"
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                        value={form.ends_on}
                        onChange={updateField("ends_on")}
                    />
                </div>
            </div>
            <div className="mt-4 flex justify-end">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white shadow hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
                >
                    {isSubmitting ? "Saving..." : "Save budget"}
                </button>
            </div>
        </form>
    );
}

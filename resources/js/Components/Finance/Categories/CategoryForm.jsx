import { useState } from "react";
import IconPicker from "@/Components/Finance/Categories/IconPicker";

export default function CategoryForm({ onSubmit }) {
    const [form, setForm] = useState({
        name: "",
        type: "expense",
        color: "#64748B",
        icon: "",
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
                type: "expense",
                color: "#64748B",
                icon: "",
            });
        });
    };

    return (
        <form onSubmit={handleSubmit} className="card p-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                Add finance category
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400">
                        Name
                    </label>
                    <input
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-dark-card"
                        value={form.name}
                        onChange={updateField("name")}
                        placeholder="Salary, Food, Rent"
                        required
                    />
                </div>
                <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400">
                        Type
                    </label>
                    <select
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-dark-card"
                        value={form.type}
                        onChange={updateField("type")}
                    >
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                        <option value="savings">Savings</option>
                        <option value="loan">Loan</option>
                    </select>
                </div>
                <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400">
                        Color
                    </label>
                    <input
                        type="color"
                        className="mt-1 h-10 w-full rounded-md border border-slate-300 p-1 dark:border-white/10 dark:bg-dark-card"
                        value={form.color}
                        onChange={updateField("color")}
                    />
                </div>
                <div>
                    <IconPicker
                        value={form.icon}
                        onChange={(value) =>
                            setForm((prev) => ({ ...prev, icon: value }))
                        }
                    />
                </div>
            </div>
            <div className="mt-4 flex justify-end">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white shadow hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
                >
                    {isSubmitting ? "Saving..." : "Save category"}
                </button>
            </div>
        </form>
    );
}

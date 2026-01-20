import { useEffect, useState } from "react";
import TagInput from "@/Components/TagInput";

const buildInitialState = (initialValues) => ({
    id: initialValues?.id,
    description: initialValues?.description ?? "",
    type: initialValues?.type ?? "expense",
    amount: initialValues?.amount ?? "",
    occurred_at: initialValues?.occurred_at
        ? initialValues.occurred_at.slice(0, 10)
        : new Date().toISOString().slice(0, 10),
    finance_category_id: initialValues?.finance_category_id ?? "",
    finance_loan_id: initialValues?.finance_loan_id ?? "",
    finance_savings_goal_id: initialValues?.finance_savings_goal_id ?? "",
    finance_budget_id: initialValues?.finance_budget_id ?? "",
    recurring_frequency: initialValues?.recurring_frequency ?? "",
    tags: initialValues?.tags ?? [],
});

export default function TransactionForm({
    onSubmit,
    categories = [],
    savingsGoals = [],
    loans = [],
    budgets = [],
    initialValues,
    submitLabel = "Save transaction",
}) {
    const [form, setForm] = useState(buildInitialState(initialValues));
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setForm(buildInitialState(initialValues));
    }, [initialValues]);

    const updateField = (field) => (event) => {
        const value = event.target.value;
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleLoanChange = (event) => {
        const value = event.target.value;
        setForm((prev) => ({
            ...prev,
            finance_loan_id: value,
            finance_budget_id: value ? "" : prev.finance_budget_id,
        }));
    };

    const handleBudgetChange = (event) => {
        const value = event.target.value;
        setForm((prev) => ({
            ...prev,
            finance_budget_id: value,
            finance_loan_id: value ? "" : prev.finance_loan_id,
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        const recurringFrequency = form.recurring_frequency || null;
        const loanSelected = Boolean(form.finance_loan_id);
        const payload = {
            ...form,
            finance_savings_goal_id:
                form.type === "savings" ? form.finance_savings_goal_id : "",
            finance_budget_id:
                form.type === "expense" && !loanSelected
                    ? form.finance_budget_id
                    : "",
            finance_loan_id:
                form.type === "expense" ? form.finance_loan_id : "",
            is_recurring: Boolean(recurringFrequency),
            recurring_frequency: recurringFrequency,
        };
        Promise.resolve(onSubmit?.(payload)).finally(() => {
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
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                    <label className="text-sm text-slate-500">
                        Description
                    </label>
                    <input
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                        value={form.description}
                        onChange={updateField("description")}
                        placeholder="Coffee, paycheck, rent"
                        required
                    />
                </div>
                <div>
                    <label className="text-sm text-slate-500">Type</label>
                    <select
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                        value={form.type}
                        onChange={updateField("type")}
                    >
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                        <option value="savings">Savings</option>
                    </select>
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
                    <label className="text-sm text-slate-500">Date</label>
                    <input
                        type="date"
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                        value={form.occurred_at}
                        onChange={updateField("occurred_at")}
                        required
                    />
                </div>
                <div>
                    <label className="text-sm text-slate-500">Recurring</label>
                    <select
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                        value={form.recurring_frequency}
                        onChange={updateField("recurring_frequency")}
                    >
                        <option value="">Not recurring</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="bi-weekly">Bi-weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                    </select>
                </div>
                <div className="sm:col-span-2">
                    <label className="text-sm text-slate-500">Category</label>
                    <select
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                        value={form.finance_category_id}
                        onChange={updateField("finance_category_id")}
                    >
                        <option value="">Uncategorized</option>
                        {categories
                            .filter((category) => category.type === form.type)
                            .map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                    </select>
                </div>
                {form.type === "savings" && (
                    <div className="sm:col-span-2">
                        <label className="text-sm text-slate-500">
                            Savings goal (optional)
                        </label>
                        <select
                            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                            value={form.finance_savings_goal_id}
                            onChange={updateField("finance_savings_goal_id")}
                        >
                            <option value="">No goal linked</option>
                            {savingsGoals.map((goal) => (
                                <option key={goal.id} value={goal.id}>
                                    {goal.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                {form.type === "expense" && (
                    <div className="sm:col-span-2">
                        <label className="text-sm text-slate-500">
                            Budget (optional)
                        </label>
                        <select
                            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                            value={form.finance_budget_id}
                            onChange={handleBudgetChange}
                        >
                            <option value="">No budget linked</option>
                            {budgets.map((budget) => (
                                <option key={budget.id} value={budget.id}>
                                    {budget.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                {form.type === "expense" && (
                    <div className="sm:col-span-2">
                        <label className="text-sm text-slate-500">
                            Loan payment (optional)
                        </label>
                        <select
                            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                            value={form.finance_loan_id}
                            onChange={handleLoanChange}
                        >
                            <option value="">No loan linked</option>
                            {loans.map((loan) => (
                                <option key={loan.id} value={loan.id}>
                                    {loan.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                <div className="sm:col-span-2">
                    <label className="text-sm text-slate-500">
                        Tags (optional)
                    </label>
                    <TagInput
                        value={form.tags}
                        onChange={(tags) =>
                            setForm((prev) => ({ ...prev, tags }))
                        }
                        placeholder="Add tags for this transaction"
                        maxTags={8}
                    />
                </div>
            </div>
            <div className="mt-4 flex justify-end">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white shadow hover:bg-indigo-500"
                >
                    {isSubmitting ? "Saving..." : submitLabel}
                </button>
            </div>
        </form>
    );
}

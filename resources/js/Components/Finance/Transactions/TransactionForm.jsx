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
    finance_account_id: initialValues?.finance_account_id ?? "",
    finance_transfer_account_id:
        initialValues?.finance_transfer_account_id ?? "",
    transfer_destination:
        initialValues?.metadata?.transfer_destination ??
        (initialValues?.finance_transfer_account_id ? "internal" : "internal"),
    transfer_fee: initialValues?.metadata?.transfer_fee ?? "",
    external_account_name:
        initialValues?.metadata?.external_account_name ?? "",
    finance_credit_card_account_id:
        initialValues?.finance_credit_card_account_id ?? "",
    recurring_frequency: initialValues?.recurring_frequency ?? "",
    tags: initialValues?.tags ?? [],
    metadata: initialValues?.metadata ?? {},
});

export default function TransactionForm({
    onSubmit,
    categories = [],
    savingsGoals = [],
    loans = [],
    budgets = [],
    accounts = [],
    initialValues,
    submitLabel = "Save transaction",
}) {
    const [form, setForm] = useState(buildInitialState(initialValues));
    const [isSubmitting, setIsSubmitting] = useState(false);
    const creditCardAccounts = accounts.filter(
        (account) => account.type === "credit-card"
    );
    const transferTargets = accounts.filter(
        (account) => String(account.id) !== String(form.finance_account_id)
    );

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
        const transferDestination =
            form.transfer_destination ||
            (form.finance_transfer_account_id ? "internal" : "external");
        const payload = {
            ...form,
            finance_savings_goal_id:
                form.type === "savings" ? form.finance_savings_goal_id : "",
            finance_budget_id:
                form.type === "expense" && !loanSelected
                    ? form.finance_budget_id
                    : "",
            finance_loan_id:
                form.type === "expense" || form.type === "loan"
                    ? form.finance_loan_id
                    : "",
            finance_credit_card_account_id:
                form.type === "expense"
                    ? form.finance_credit_card_account_id
                    : "",
            finance_category_id:
                form.type === "transfer" ? "" : form.finance_category_id,
            finance_transfer_account_id:
                form.type === "transfer"
                    ? transferDestination === "internal"
                        ? form.finance_transfer_account_id
                        : ""
                    : "",
            metadata:
                form.type === "transfer"
                    ? {
                          transfer_destination: transferDestination,
                          external_account_name:
                              transferDestination === "external"
                                  ? form.external_account_name
                                  : "",
                          transfer_fee:
                              form.transfer_fee === ""
                                  ? null
                                  : Number(form.transfer_fee),
                      }
                    : form.metadata,
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

    useEffect(() => {
        if (form.type !== "expense" && form.finance_credit_card_account_id) {
            setForm((prev) => ({
                ...prev,
                finance_credit_card_account_id: "",
            }));
        }
    }, [form.type, form.finance_credit_card_account_id]);

    useEffect(() => {
        if (form.type === "transfer" && form.finance_category_id) {
            setForm((prev) => ({ ...prev, finance_category_id: "" }));
        }
        if (form.type === "transfer" && form.finance_loan_id) {
            setForm((prev) => ({ ...prev, finance_loan_id: "" }));
        }
        if (form.type === "transfer" && form.finance_budget_id) {
            setForm((prev) => ({ ...prev, finance_budget_id: "" }));
        }
        if (form.type === "transfer" && form.finance_savings_goal_id) {
            setForm((prev) => ({ ...prev, finance_savings_goal_id: "" }));
        }
        if (form.type !== "transfer" && form.transfer_fee !== "") {
            setForm((prev) => ({ ...prev, transfer_fee: "" }));
        }
    }, [
        form.type,
        form.finance_category_id,
        form.finance_loan_id,
        form.finance_budget_id,
        form.finance_savings_goal_id,
        form.transfer_fee,
    ]);

    useEffect(() => {
        if (form.type === "transfer" && form.transfer_destination === "external") {
            setForm((prev) => ({ ...prev, finance_transfer_account_id: "" }));
        }
        if (form.type === "transfer" && form.transfer_destination === "internal") {
            setForm((prev) => ({ ...prev, external_account_name: "" }));
        }
    }, [form.type, form.transfer_destination]);

    useEffect(() => {
        const account = accounts.find(
            (item) => String(item.id) === String(form.finance_account_id)
        );
        if (account?.type === "credit-card") {
            setForm((prev) => ({ ...prev, finance_credit_card_account_id: "" }));
        }
    }, [accounts, form.finance_account_id]);

    return (
        <form onSubmit={handleSubmit} className="card p-4">
            <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400">
                        Description
                    </label>
                    <input
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-dark-card"
                        value={form.description}
                        onChange={updateField("description")}
                        placeholder="Coffee, paycheck, rent"
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
                        <option value="loan">Loan</option>
                        <option value="expense">Expense</option>
                        <option value="savings">Savings</option>
                        <option value="transfer">Transfer</option>
                    </select>
                </div>
                <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400">
                        Amount
                    </label>
                    <input
                        type="number"
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-dark-card"
                        value={form.amount}
                        onChange={updateField("amount")}
                        min="0"
                        step="0.01"
                        required
                    />
                </div>
                {form.type === "transfer" && (
                    <div>
                        <label className="text-sm text-slate-500 dark:text-slate-400">
                            Transfer fee (optional)
                        </label>
                        <input
                            type="number"
                            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-dark-card"
                            value={form.transfer_fee}
                            onChange={updateField("transfer_fee")}
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                        />
                    </div>
                )}
                <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400">
                        Date
                    </label>
                    <input
                        type="date"
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-dark-card"
                        value={form.occurred_at}
                        onChange={updateField("occurred_at")}
                        required
                    />
                </div>
                <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400">
                        Recurring
                    </label>
                    <select
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-dark-card"
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
                {form.type !== "transfer" && (
                    <div className="md:col-span-2">
                    <label className="text-sm text-slate-500 dark:text-slate-400">
                        Category
                    </label>
                    <select
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-dark-card"
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
                )}
                {form.type === "loan" && (
                    <div className="sm:col-span-2 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs text-cyan-700 dark:border-cyan-700/60 dark:bg-cyan-900/20 dark:text-cyan-200">
                        Loan transactions add cash to the selected account and
                        create a loan tracker using the description and amount.
                    </div>
                )}
                <div className="md:col-span-1">
                    <label className="text-sm text-slate-500 dark:text-slate-400">
                        {form.type === "transfer"
                            ? "From account"
                            : "Account (optional)"}
                    </label>
                    <select
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-dark-card"
                        value={form.finance_account_id}
                        onChange={updateField("finance_account_id")}
                        required={form.type === "transfer"}
                    >
                        <option value="">
                            {form.type === "transfer"
                                ? "Select account"
                                : "No account linked"}
                        </option>
                        {accounts.map((account) => (
                            <option key={account.id} value={account.id}>
                                {account.label} - {account.name}
                            </option>
                        ))}
                    </select>
                </div>
                {form.type === "transfer" && (
                    <div className="md:col-span-1">
                        <label className="text-sm text-slate-500 dark:text-slate-400">
                            Destination
                        </label>
                        <select
                            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-dark-card"
                            value={form.transfer_destination}
                            onChange={updateField("transfer_destination")}
                        >
                            <option value="internal">My accounts</option>
                            <option value="external">Someone else</option>
                        </select>
                    </div>
                )}
                {form.type === "transfer" && form.transfer_destination === "external" && (
                    <div className="md:col-span-1">
                        <label className="text-sm text-slate-500 dark:text-slate-400">
                            Recipient account
                        </label>
                        <input
                            type="text"
                            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-dark-card"
                            value={form.external_account_name}
                            onChange={updateField("external_account_name")}
                            placeholder="e.g., Maya (GCash)"
                            required
                        />
                    </div>
                )}
                {form.type === "transfer" && form.transfer_destination === "internal" && (
                    <div className="md:col-span-1">
                        <label className="text-sm text-slate-500 dark:text-slate-400">
                            To account
                        </label>
                        <select
                            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-dark-card"
                            value={form.finance_transfer_account_id}
                            onChange={updateField("finance_transfer_account_id")}
                            required
                        >
                            <option value="">Select account</option>
                            {transferTargets.map((account) => (
                                <option key={account.id} value={account.id}>
                                    {account.label} - {account.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                {form.type === "savings" && (
                    <div className="md:col-span-1">
                        <label className="text-sm text-slate-500 dark:text-slate-400">
                            Savings goal (optional)
                        </label>
                        <select
                            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-dark-card"
                            value={form.finance_savings_goal_id}
                            onChange={updateField("finance_savings_goal_id")}
                        >
                            <option value="">No goal linked</option>
                            {savingsGoals.map((goal) => (
                                <option key={goal.id} value={goal.id}>
                                    {goal.label}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                {form.type === "expense" && (
                    <div className="md:col-span-1">
                        <label className="text-sm text-slate-500 dark:text-slate-400">
                            Budget (optional)
                        </label>
                        <select
                            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-dark-card"
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
                    <div className="md:col-span-1">
                        <label className="text-sm text-slate-500 dark:text-slate-400">
                            Loan payment (optional)
                        </label>
                        <select
                            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-dark-card"
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
                {form.type === "expense" &&
                    creditCardAccounts.length > 0 && (
                    <div className="md:col-span-1">
                        <label className="text-sm text-slate-500 dark:text-slate-400">
                            Credit card payment (optional)
                        </label>
                        <select
                            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-dark-card"
                            value={form.finance_credit_card_account_id}
                            onChange={updateField(
                                "finance_credit_card_account_id"
                            )}
                            disabled={
                                accounts.find(
                                    (account) =>
                                        String(account.id) ===
                                        String(form.finance_account_id)
                                )?.type === "credit-card"
                            }
                        >
                            <option value="">Not a credit card payment</option>
                            {creditCardAccounts.map((account) => (
                                <option key={account.id} value={account.id}>
                                    {account.name}
                                </option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                            This will restore available credit on the selected
                            card.
                        </p>
                    </div>
                )}
                <div className="md:col-span-2">
                    <label className="text-sm text-slate-500 dark:text-slate-400">
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

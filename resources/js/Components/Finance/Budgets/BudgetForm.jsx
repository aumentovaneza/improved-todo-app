import { useEffect, useState } from "react";

const getToday = () => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
};

const toISODate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const getPeriodRange = (baseDate, period) => {
    const date = new Date(baseDate);
    if (Number.isNaN(date.getTime())) {
        return { start: "", end: "" };
    }

    let start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    let end = new Date(start);

    switch (period) {
        case "weekly": {
            const day = start.getDay();
            start.setDate(start.getDate() - day);
            end = new Date(start);
            end.setDate(end.getDate() + 6);
            break;
        }
        case "monthly":
            start = new Date(start.getFullYear(), start.getMonth(), 1);
            end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
            break;
        case "quarterly": {
            const quarterStartMonth = Math.floor(start.getMonth() / 3) * 3;
            start = new Date(start.getFullYear(), quarterStartMonth, 1);
            end = new Date(start.getFullYear(), quarterStartMonth + 3, 0);
            break;
        }
        case "yearly":
            start = new Date(start.getFullYear(), 0, 1);
            end = new Date(start.getFullYear(), 11, 31);
            break;
        default:
            break;
    }

    return { start: toISODate(start), end: toISODate(end) };
};

const buildInitialState = (initialValues) => {
    const isEditing = Boolean(initialValues?.id);
    const isRecurring =
        initialValues?.is_recurring !== undefined
            ? initialValues.is_recurring
            : true;
    const period = isRecurring
        ? initialValues?.period ?? "monthly"
        : initialValues?.period ?? "";
    const storedStarts = initialValues?.starts_on
        ? initialValues.starts_on.slice(0, 10)
        : "";
    const storedEnds = initialValues?.ends_on
        ? initialValues.ends_on.slice(0, 10)
        : "";
    const defaultRange = getPeriodRange(getToday(), period);
    const startsOn = isEditing
        ? storedStarts
        : isRecurring
          ? defaultRange.start
          : "";
    const endsOn = isEditing
        ? storedEnds
        : isRecurring
          ? defaultRange.end
          : "";

    return {
        id: initialValues?.id,
        name: initialValues?.name ?? "",
        amount: initialValues?.amount ?? "",
        currency: initialValues?.currency ?? "PHP",
        period,
        is_recurring: isRecurring,
        starts_on: startsOn,
        ends_on: endsOn,
        finance_category_id: initialValues?.finance_category_id ?? "",
        finance_account_id: initialValues?.finance_account_id ?? "",
        budget_type: initialValues?.budget_type ?? "spending",
    };
};

export default function BudgetForm({
    categories = [],
    accounts = [],
    onSubmit,
    initialValues,
    submitLabel = "Save budget",
}) {
    const [form, setForm] = useState(buildInitialState(initialValues));
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setForm(buildInitialState(initialValues));
    }, [initialValues]);

    const updateField = (field) => (event) => {
        const value =
            field === "is_recurring" ? event.target.checked : event.target.value;
        setForm((prev) => {
            const next = { ...prev, [field]: value };
            if (field === "is_recurring" && !value) {
                next.period = "";
                next.starts_on = "";
                next.ends_on = "";
            }
            if (field === "period") {
                if (next.is_recurring) {
                    const range = getPeriodRange(getToday(), value);
                    next.starts_on = range.start;
                    next.ends_on = range.end;
                } else if (next.starts_on) {
                    next.ends_on = getPeriodRange(
                        new Date(next.starts_on),
                        value
                    ).end;
                }
            }
            if (field === "starts_on" && !next.is_recurring) {
                const range = getPeriodRange(new Date(value), next.period);
                if (range.end) {
                    next.ends_on = range.end;
                }
            }
            return next;
        });
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
                    <label className="text-sm text-slate-500 dark:text-slate-400">
                        Name
                    </label>
                    <input
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                        value={form.name}
                        onChange={updateField("name")}
                        placeholder="Groceries budget"
                        required
                    />
                </div>
                <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400">
                        Amount
                    </label>
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
                {form.is_recurring && (
                    <div>
                        <label className="text-sm text-slate-500 dark:text-slate-400">
                            Period
                        </label>
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
                )}
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="budget_is_recurring"
                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                        checked={form.is_recurring}
                        onChange={updateField("is_recurring")}
                    />
                    <label
                        htmlFor="budget_is_recurring"
                        className="text-sm text-slate-500 dark:text-slate-400"
                    >
                        Recurring budget
                    </label>
                </div>
                <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400">
                        Budget type
                    </label>
                    <select
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                        value={form.budget_type}
                        onChange={updateField("budget_type")}
                    >
                        <option value="spending">Spending budget</option>
                        <option value="saved">Saved budget</option>
                    </select>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                        Saved budgets must be reallocated when deleted.
                    </p>
                </div>
                <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400">
                        Category
                    </label>
                    <select
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                        value={form.finance_category_id}
                        onChange={updateField("finance_category_id")}
                    >
                        <option value="">All categories</option>
                        {categories
                            .filter((category) => category.type === "expense")
                            .map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                    </select>
                </div>
                <div>
                    <label className="text-sm text-slate-500 dark:text-slate-400">
                        Account (optional)
                    </label>
                    <select
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                        value={form.finance_account_id}
                        onChange={updateField("finance_account_id")}
                    >
                        <option value="">Any account</option>
                        {accounts.map((account) => (
                            <option key={account.id} value={account.id}>
                                {account.name}
                            </option>
                        ))}
                    </select>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                        Use this if you want a budget tied to a specific account.
                    </p>
                </div>
                {form.is_recurring && (
                    <>
                        <div>
                            <label className="text-sm text-slate-500 dark:text-slate-400">
                                Start date
                            </label>
                            <input
                                type="date"
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                                value={form.starts_on}
                                onChange={updateField("starts_on")}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-sm text-slate-500 dark:text-slate-400">
                                End date
                            </label>
                            <input
                                type="date"
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                                value={form.ends_on}
                                onChange={updateField("ends_on")}
                                disabled={form.is_recurring}
                            />
                        </div>
                    </>
                )}
                {!form.is_recurring && (
                    <div className="sm:col-span-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        Non-recurring budgets do not have a period or dates.
                    </div>
                )}
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

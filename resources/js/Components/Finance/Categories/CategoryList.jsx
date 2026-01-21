import { useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import * as LucideIcons from "lucide-react";
import IconPicker from "@/Components/Finance/Categories/IconPicker";

export default function CategoryList({
    categories = [],
    onUpdate,
    onDelete,
}) {
    const iconMap = useMemo(() => {
        return Object.entries(LucideIcons).reduce((acc, [name, Icon]) => {
            if (typeof Icon === "function") {
                acc[name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()] =
                    Icon;
            }
            return acc;
        }, {});
    }, []);
    const [editingId, setEditingId] = useState(null);
    const [draft, setDraft] = useState({
        name: "",
        type: "expense",
        color: "#64748B",
        icon: "",
    });

    const startEdit = (category) => {
        setEditingId(category.id);
        setDraft({
            name: category.name ?? "",
            type: category.type ?? "expense",
            color: category.color ?? "#64748B",
            icon: category.icon ?? "",
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setDraft({
            name: "",
            type: "expense",
            color: "#64748B",
            icon: "",
        });
    };

    const updateField = (field) => (event) => {
        setDraft((prev) => ({ ...prev, [field]: event.target.value }));
    };

    const saveEdit = async (category) => {
        await onUpdate?.(category, draft);
        setEditingId(null);
    };

    return (
        <div className="card p-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                Finance categories
            </h3>
            <div className="mt-4 space-y-3">
                {categories.map((category) => (
                    <div
                        key={category.id}
                        className="rounded-lg border border-light-border/70 px-3 py-2 text-sm text-slate-600 dark:border-white/10 dark:text-slate-300"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <span
                                    className="h-3 w-3 rounded-full"
                                    style={{ backgroundColor: category.color }}
                                />
                                {category.icon && (
                                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                                        {iconMap[category.icon] ? (
                                            (() => {
                                                const Icon = iconMap[category.icon];
                                                return <Icon className="h-4 w-4" />;
                                            })()
                                        ) : (
                                            <span className="text-lg leading-none">
                                                {category.icon}
                                            </span>
                                        )}
                                    </span>
                                )}
                                <div>
                                    <p className="font-medium text-slate-800 dark:text-slate-100">
                                        {category.name}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {category.type}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => startEdit(category)}
                                    className="rounded-md p-1 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                                    title="Edit"
                                    aria-label="Edit"
                                >
                                    <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onDelete?.(category)}
                                    className="rounded-md p-1 text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
                                    title="Delete"
                                    aria-label="Delete"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {editingId === category.id && (
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="text-xs text-slate-500 dark:text-slate-400">
                                        Name
                                    </label>
                                    <input
                                        className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                                        value={draft.name}
                                        onChange={updateField("name")}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 dark:text-slate-400">
                                        Type
                                    </label>
                                    <select
                                        className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                                        value={draft.type}
                                        onChange={updateField("type")}
                                    >
                                        <option value="income">Income</option>
                                        <option value="expense">Expense</option>
                                        <option value="savings">Savings</option>
                                        <option value="loan">Loan</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 dark:text-slate-400">
                                        Color
                                    </label>
                                    <input
                                        type="color"
                                        className="mt-1 h-9 w-full rounded-md border border-slate-300 p-1 dark:border-slate-600 dark:bg-slate-800"
                                        value={draft.color}
                                        onChange={updateField("color")}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 dark:text-slate-400">
                                        Emoji
                                    </label>
                                    <IconPicker
                                        value={draft.icon}
                                        onChange={(value) =>
                                            setDraft((prev) => ({
                                                ...prev,
                                                icon: value,
                                            }))
                                        }
                                    />
                                </div>
                                <div className="flex justify-end gap-2 sm:col-span-2">
                                    <button
                                        type="button"
                                        onClick={cancelEdit}
                                        className="rounded-md border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:text-slate-300 dark:hover:text-slate-100"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => saveEdit(category)}
                                        className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-500"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                {(!categories || categories.length === 0) && (
                    <p className="text-sm text-slate-400 dark:text-slate-500">
                        No finance categories yet.
                    </p>
                )}
            </div>
        </div>
    );
}

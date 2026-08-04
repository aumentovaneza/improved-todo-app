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
        const forwardRefSymbol = Symbol.for("react.forward_ref");
        return Object.entries(LucideIcons).reduce((acc, [name, Icon]) => {
            // Skip the `*Icon` aliases lucide-react ships alongside the canonical names.
            if (name.endsWith("Icon")) return acc;
            const isComponent =
                typeof Icon === "function" ||
                (Icon && typeof Icon === "object" && Icon.$$typeof === forwardRefSymbol);
            if (!isComponent) return acc;
            const kebab = name
                .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
                .toLowerCase();
            acc[kebab] = Icon;
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
            <h3 className="text-lg font-semibold text-light-primary dark:text-dark-primary">
                Finance categories
            </h3>
            <div className="mt-4 space-y-3">
                {categories.map((category) => (
                    <div
                        key={category.id}
                        className="rounded-lg border border-light-border/70 px-3 py-2 text-sm text-light-secondary dark:border-dark-border/70 dark:text-dark-secondary"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                                <span
                                    className="h-3 w-3 shrink-0 rounded-full"
                                    style={{ backgroundColor: category.color }}
                                />
                                {category.icon && (
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-light-hover text-light-secondary dark:bg-dark-hover dark:text-dark-secondary">
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
                                <div className="min-w-0">
                                    <p className="truncate font-medium text-light-primary dark:text-dark-primary">
                                        {category.name}
                                    </p>
                                    <p className="text-xs capitalize text-light-muted dark:text-dark-muted">
                                        {category.type}
                                    </p>
                                </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => startEdit(category)}
                                    className="rounded-md p-2 text-wevie-teal hover:text-wevie-teal/80 dark:text-wevie-mint dark:hover:text-wevie-mint/80"
                                    title="Edit"
                                    aria-label="Edit"
                                >
                                    <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onDelete?.(category)}
                                    className="rounded-md p-2 text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
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
                                    <label className="text-xs text-light-muted dark:text-dark-muted">
                                        Name
                                    </label>
                                    <input
                                        className="mt-1 w-full rounded-md border border-light-border px-2 py-1 text-sm text-light-primary focus:border-wevie-teal focus:outline-none focus:ring-1 focus:ring-wevie-teal dark:border-dark-border dark:bg-dark-hover dark:text-dark-primary"
                                        value={draft.name}
                                        onChange={updateField("name")}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-light-muted dark:text-dark-muted">
                                        Type
                                    </label>
                                    <select
                                        className="mt-1 w-full rounded-md border border-light-border px-2 py-1 text-sm text-light-primary focus:border-wevie-teal focus:outline-none focus:ring-1 focus:ring-wevie-teal dark:border-dark-border dark:bg-dark-hover dark:text-dark-primary"
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
                                    <label className="text-xs text-light-muted dark:text-dark-muted">
                                        Color
                                    </label>
                                    <input
                                        type="color"
                                        className="mt-1 h-9 w-full rounded-md border border-light-border p-1 dark:border-dark-border dark:bg-dark-hover"
                                        value={draft.color}
                                        onChange={updateField("color")}
                                    />
                                </div>
                                <div>
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
                                        className="rounded-md border border-light-border px-3 py-1 text-xs font-semibold text-light-secondary hover:text-light-primary dark:border-dark-border dark:text-dark-secondary dark:hover:text-dark-primary"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => saveEdit(category)}
                                        className="rounded-md bg-wevie-teal px-3 py-1 text-xs font-semibold text-white hover:bg-wevie-teal/90"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                {(!categories || categories.length === 0) && (
                    <p className="text-sm text-light-muted dark:text-dark-muted">
                        No finance categories yet.
                    </p>
                )}
            </div>
        </div>
    );
}

import { useMemo, useState } from "react";
import * as LucideIcons from "lucide-react";

const toKebabCase = (value) =>
    value.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

const buildIconList = () =>
    Object.entries(LucideIcons)
        .filter(
            ([name, Icon]) =>
                typeof Icon === "function" && /^[A-Z]/.test(name)
        )
        .map(([name, Icon]) => ({
            name,
            value: toKebabCase(name),
            Icon,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

export default function IconPicker({ value, onChange }) {
    const [query, setQuery] = useState("");
    const icons = useMemo(() => buildIconList(), []);
    const iconMap = useMemo(
        () =>
            icons.reduce((acc, icon) => {
                acc[icon.value] = icon;
                return acc;
            }, {}),
        [icons]
    );
    const filteredIcons = icons.filter((icon) =>
        icon.name.toLowerCase().includes(query.toLowerCase())
    );
    const selectedIcon = value ? iconMap[value] : null;

    const handleClear = () => {
        setQuery("");
        onChange?.("");
    };

    return (
        <div>
            <div className="flex items-center justify-between">
                <label className="text-sm text-slate-500 dark:text-slate-400">
                    Icon
                </label>
                <button
                    type="button"
                    onClick={handleClear}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100"
                >
                    Clear
                </button>
            </div>
            {selectedIcon && (
                <div className="mt-2 flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    <selectedIcon.Icon className="h-4 w-4" />
                    <span>{selectedIcon.name}</span>
                </div>
            )}
            <input
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search icons..."
            />
            <div className="mt-2 grid max-h-48 grid-cols-6 gap-2 overflow-y-auto rounded-md border border-slate-200 p-2 dark:border-slate-700">
                {filteredIcons.map(({ name, value: iconValue, Icon }) => (
                    <button
                        key={name}
                        type="button"
                        onClick={() => onChange?.(iconValue)}
                        className={`flex h-9 w-9 items-center justify-center rounded-md border text-slate-600 transition ${
                            value === iconValue
                                ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200"
                                : "border-transparent hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-700 dark:hover:bg-slate-800"
                        }`}
                        title={name}
                    >
                        <Icon className="h-4 w-4" />
                    </button>
                ))}
                {filteredIcons.length === 0 && (
                    <p className="col-span-6 text-center text-xs text-slate-400 dark:text-slate-500">
                        No matching icons
                    </p>
                )}
            </div>
        </div>
    );
}

import { useState } from "react";
import { Combobox, ComboboxInput, ComboboxOptions, ComboboxOption } from "@headlessui/react";
import { X, Plus } from "lucide-react";

export default function TagInput({
    value = [],
    onChange,
    suggestions = [],
    maxTags = 15,
    placeholder = "Add a tag…",
}) {
    const [query, setQuery] = useState("");

    const addTag = (raw) => {
        const name = (raw || "").trim();
        if (!name) return;
        const exists = value.some((t) => t.toLowerCase() === name.toLowerCase());
        if (exists || value.length >= maxTags) {
            setQuery("");
            return;
        }
        onChange?.([...value, name]);
        setQuery("");
    };

    const removeTag = (name) => {
        onChange?.(value.filter((t) => t !== name));
    };

    const normalizedQuery = query.trim().toLowerCase();
    const available = suggestions
        .filter((s) => !value.some((t) => t.toLowerCase() === s.name.toLowerCase()))
        .filter((s) => normalizedQuery === "" || s.name.toLowerCase().includes(normalizedQuery));

    const canCreate =
        normalizedQuery !== "" &&
        !suggestions.some((s) => s.name.toLowerCase() === normalizedQuery) &&
        !value.some((t) => t.toLowerCase() === normalizedQuery);

    return (
        <div>
            {value.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                    {value.map((name) => (
                        <span
                            key={name}
                            className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                        >
                            {name}
                            <button
                                type="button"
                                onClick={() => removeTag(name)}
                                aria-label={`Remove tag ${name}`}
                                className="rounded-full p-0.5 transition-colors hover:bg-primary-200/60 dark:hover:bg-primary-800/50"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {value.length < maxTags && (
                <Combobox
                    value={null}
                    onChange={(selected) => {
                        if (selected) addTag(selected);
                    }}
                >
                    <div className="relative">
                        <ComboboxInput
                            className="input-primary w-full rounded-xl px-3 py-2 text-sm"
                            placeholder={placeholder}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && query.trim()) {
                                    e.preventDefault();
                                    addTag(query);
                                } else if (e.key === "Backspace" && !query && value.length > 0) {
                                    removeTag(value[value.length - 1]);
                                }
                            }}
                        />
                        {(available.length > 0 || canCreate) && (
                            <ComboboxOptions className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-light-border/70 bg-light-card py-1 shadow-soft focus:outline-none dark:border-dark-border/70 dark:bg-dark-card">
                                {canCreate && (
                                    <ComboboxOption
                                        value={query.trim()}
                                        className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-light-primary data-[focus]:bg-light-hover dark:text-dark-primary dark:data-[focus]:bg-dark-hover"
                                    >
                                        <Plus className="h-4 w-4 text-wevie-teal" />
                                        Create &ldquo;{query.trim()}&rdquo;
                                    </ComboboxOption>
                                )}
                                {available.map((s) => (
                                    <ComboboxOption
                                        key={s.id ?? s.name}
                                        value={s.name}
                                        className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-light-primary data-[focus]:bg-light-hover dark:text-dark-primary dark:data-[focus]:bg-dark-hover"
                                    >
                                        <span
                                            className="h-2.5 w-2.5 rounded-full"
                                            style={{
                                                backgroundColor: s.color || "#6FD9D3",
                                            }}
                                            aria-hidden="true"
                                        />
                                        {s.name}
                                    </ComboboxOption>
                                ))}
                            </ComboboxOptions>
                        )}
                    </div>
                </Combobox>
            )}
            <p className="mt-1 text-xs text-light-muted dark:text-dark-muted">
                Press Enter to add. Pick from existing tags or create a new one.
            </p>
        </div>
    );
}

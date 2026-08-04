import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { router, useForm, usePage } from "@inertiajs/react";
import { Check, Layers3, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";

export default function CalendarSources({
    calendars,
    sources,
    selectedCalendarIds,
    onSourcesChange,
    onCalendarsChange,
}) {
    const createForm = useForm({ name: "", color: "#4ACF91" });
    const { errors = {} } = usePage().props;
    const [editingId, setEditingId] = useState(null);
    const [draft, setDraft] = useState({ name: "", color: "#4ACF91" });

    const toggleSource = (source) => {
        const next = sources.includes(source)
            ? sources.filter((value) => value !== source)
            : [...sources, source];
        onSourcesChange(next);
    };

    const toggleCalendar = (id) => {
        onCalendarsChange(
            selectedCalendarIds.includes(id)
                ? selectedCalendarIds.filter((value) => value !== id)
                : [...selectedCalendarIds, id]
        );
    };

    const createCalendar = (event) => {
        event.preventDefault();
        createForm.post(route("event-calendars.store"), {
            preserveScroll: true,
            onSuccess: () => createForm.reset("name"),
        });
    };

    const saveCalendar = (calendar) => {
        router.put(route("event-calendars.update", calendar.id), draft, {
            preserveScroll: true,
            onSuccess: () => setEditingId(null),
        });
    };

    return (
        <Popover className="relative">
            <PopoverButton className="btn-secondary inline-flex min-h-11 flex-1 items-center justify-center gap-2 px-6 text-sm sm:flex-none">
                <Layers3 className="h-4 w-4" /> Calendars
            </PopoverButton>
            <PopoverPanel
                anchor="bottom end"
                className="z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-light-border bg-light-card p-4 shadow-xl dark:border-dark-border dark:bg-dark-card"
            >
                <h3 className="text-sm font-semibold text-light-primary dark:text-dark-primary">
                    Show on calendar
                </h3>
                <div className="mt-3 space-y-1">
                    {[
                        ["events", "Events"],
                        ["tasks", "Tasks"],
                        ["finance", "Finance"],
                        ["meals", "Meal planning"],
                    ].map(([value, label]) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => toggleSource(value)}
                            className="flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-sm text-light-secondary hover:bg-light-hover dark:text-dark-secondary dark:hover:bg-dark-hover"
                        >
                            <span>{label}</span>
                            {sources.includes(value) && (
                                <Check className="h-4 w-4 text-wevie-teal" />
                            )}
                        </button>
                    ))}
                </div>

                <div className="my-4 border-t border-light-border dark:border-dark-border" />
                <h3 className="text-sm font-semibold text-light-primary dark:text-dark-primary">
                    My calendars
                </h3>
                <div className="mt-2 space-y-1">
                    {calendars.map((calendar) =>
                        editingId === calendar.id ? (
                            <div
                                key={calendar.id}
                                className="rounded-xl border border-light-border p-2 dark:border-dark-border"
                            >
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={draft.color}
                                        onChange={(e) =>
                                            setDraft({ ...draft, color: e.target.value })
                                        }
                                        className="h-10 w-10 rounded border-0 bg-transparent p-0"
                                        aria-label="Calendar color"
                                    />
                                    <input
                                        value={draft.name}
                                        onChange={(e) =>
                                            setDraft({ ...draft, name: e.target.value })
                                        }
                                        className="input-primary min-w-0 flex-1 py-1 text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => saveCalendar(calendar)}
                                        aria-label="Save calendar"
                                        className="rounded-lg p-2 text-success-600 hover:bg-success-50 dark:text-success-400 dark:hover:bg-success-900/20"
                                    >
                                        <Check className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditingId(null)}
                                        aria-label="Cancel calendar edit"
                                        className="rounded-lg p-2 text-light-muted hover:bg-light-hover dark:text-dark-muted dark:hover:bg-dark-hover"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div
                                key={calendar.id}
                                className="group flex min-h-11 items-center gap-2 rounded-xl px-2 hover:bg-light-hover dark:hover:bg-dark-hover"
                            >
                                <button
                                    type="button"
                                    onClick={() => toggleCalendar(calendar.id)}
                                    className="flex min-w-0 flex-1 items-center gap-3 text-left text-sm text-light-secondary dark:text-dark-secondary"
                                >
                                    <span
                                        className="h-3 w-3 rounded-full"
                                        style={{ backgroundColor: calendar.color }}
                                    />
                                    <span className="truncate">{calendar.name}</span>
                                    {selectedCalendarIds.includes(calendar.id) && (
                                        <Check className="ml-auto h-4 w-4 text-wevie-teal" />
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingId(calendar.id);
                                        setDraft({ name: calendar.name, color: calendar.color });
                                    }}
                                    aria-label={`Edit ${calendar.name}`}
                                    className="rounded-lg p-2 text-light-muted opacity-100 hover:text-light-primary dark:text-dark-muted dark:hover:text-dark-primary sm:opacity-0 sm:group-hover:opacity-100"
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                </button>
                                {!calendar.is_default && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            confirm(`Remove ${calendar.name}?`) &&
                                            router.delete(
                                                route("event-calendars.destroy", calendar.id),
                                                { preserveScroll: true }
                                            )
                                        }
                                        aria-label={`Remove ${calendar.name}`}
                                        className="rounded-lg p-2 text-light-muted opacity-100 hover:text-error-600 dark:text-dark-muted dark:hover:text-error-400 sm:opacity-0 sm:group-hover:opacity-100"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                        )
                    )}
                </div>

                <form
                    onSubmit={createCalendar}
                    className="mt-3 flex items-center gap-2 border-t border-light-border pt-3 dark:border-dark-border"
                >
                    <input
                        type="color"
                        value={createForm.data.color}
                        onChange={(e) => createForm.setData("color", e.target.value)}
                        className="h-10 w-10 rounded border-0 bg-transparent p-0"
                        aria-label="New calendar color"
                    />
                    <input
                        value={createForm.data.name}
                        onChange={(e) => createForm.setData("name", e.target.value)}
                        className="input-primary min-w-0 flex-1 py-2 text-sm"
                        placeholder="New calendar"
                        aria-label="New calendar name"
                    />
                    <button
                        type="submit"
                        disabled={createForm.processing || !createForm.data.name.trim()}
                        aria-label="Create calendar"
                        className="rounded-xl bg-wevie-teal p-2.5 text-white disabled:opacity-40"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                </form>
                {(createForm.errors.name ||
                    createForm.errors.color ||
                    errors.name ||
                    errors.color ||
                    errors.calendar) && (
                    <p className="mt-2 text-xs text-error-600 dark:text-error-400" role="alert">
                        {createForm.errors.name ||
                            createForm.errors.color ||
                            errors.name ||
                            errors.color ||
                            errors.calendar}
                    </p>
                )}
            </PopoverPanel>
        </Popover>
    );
}

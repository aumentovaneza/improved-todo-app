import Modal from "@/Components/Modal";
import { router, useForm } from "@inertiajs/react";
import { CalendarDays, MapPin, Repeat2, Trash2, X } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Temporal } from "temporal-polyfill";

const WEEKDAYS = [
    ["SU", "Sun"],
    ["MO", "Mon"],
    ["TU", "Tue"],
    ["WE", "Wed"],
    ["TH", "Thu"],
    ["FR", "Fri"],
    ["SA", "Sat"],
];

const REMINDERS = [
    [0, "At start time"],
    [10, "10 minutes before"],
    [30, "30 minutes before"],
    [60, "1 hour before"],
    [1440, "1 day before"],
    [10080, "1 week before"],
    [40320, "4 weeks before"],
];

const toDate = (value) => {
    if (!value) return "";
    if (value instanceof Date) {
        return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
    }
    return String(value).slice(0, 10);
};

const toInclusiveAllDayEnd = (value) => {
    if (!value) return "";
    return Temporal.PlainDate.from(toDate(value)).subtract({ days: 1 }).toString();
};

const toLocalDateTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).slice(0, 16);
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
};

const defaultTimes = () => {
    const start = new Date();
    start.setMinutes(0, 0, 0);
    start.setHours(start.getHours() + 1);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    return {
        start: toLocalDateTime(start.toISOString()),
        end: toLocalDateTime(end.toISOString()),
    };
};

const parseRule = (rule) => {
    const parts = {};
    String(rule || "")
        .replace(/^RRULE:/i, "")
        .split(";")
        .filter(Boolean)
        .forEach((part) => {
            const [key, value] = part.split("=");
            parts[key] = value;
        });
    return parts;
};

const buildRule = (data) => {
    if (!data.repeat_frequency) return null;
    const parts = [
        `FREQ=${data.repeat_frequency.toUpperCase()}`,
        `INTERVAL=${Math.max(1, Number(data.repeat_interval) || 1)}`,
    ];
    if (data.repeat_frequency === "weekly" && data.repeat_days.length) {
        parts.push(`BYDAY=${data.repeat_days.join(",")}`);
    }
    if (data.repeat_frequency === "monthly") {
        const start = new Date(`${data.start_date || toDate(data.starts_at)}T12:00:00`);
        if (data.monthly_pattern === "weekday") {
            const code = WEEKDAYS[start.getDay()][0];
            const ordinal =
                start.getDate() + 7 >
                new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate()
                    ? -1
                    : Math.ceil(start.getDate() / 7);
            parts.push(`BYDAY=${ordinal}${code}`);
        } else {
            parts.push(`BYMONTHDAY=${start.getDate()}`);
        }
    }
    if (data.repeat_frequency === "yearly") {
        const start = new Date(`${data.start_date || toDate(data.starts_at)}T12:00:00`);
        parts.push(`BYMONTH=${start.getMonth() + 1}`, `BYMONTHDAY=${start.getDate()}`);
    }
    if (data.repeat_end === "until" && data.repeat_until) {
        parts.push(`UNTIL=${data.repeat_until.replaceAll("-", "")}T235959Z`);
    }
    if (data.repeat_end === "count" && data.repeat_count) {
        parts.push(`COUNT=${Math.max(1, Number(data.repeat_count))}`);
    }
    return parts.join(";");
};

export default function EventModal({
    show,
    onClose,
    calendars = [],
    timezone = "UTC",
    item = null,
    initialSelection = null,
}) {
    const editing = Boolean(item?.eventId);
    const event = item?.extendedProps?.event || {};
    const parsedRule = useMemo(() => parseRule(event.recurrence_rule), [event.recurrence_rule]);
    const fallbackTimes = useMemo(defaultTimes, [show]);
    const initialStart = initialSelection?.start || item?.start || fallbackTimes.start;
    const initialEnd = initialSelection?.end || item?.end || fallbackTimes.end;

    const form = useForm({
        scope: event.recurrence_rule ? "occurrence" : "series",
        occurrence_key: item?.occurrenceKey || "",
        event_calendar_id: event.event_calendar_id || calendars[0]?.id || "",
        title: event.title || "",
        notes: event.notes || "",
        location: event.location || "",
        kind: event.kind || initialSelection?.kind || "event",
        is_all_day: initialSelection?.allDay ?? item?.allDay ?? false,
        start_date: toDate(initialStart) || toDate(new Date()),
        end_date:
            initialSelection?.allDay || item?.allDay
                ? toInclusiveAllDayEnd(initialEnd)
                : toDate(initialEnd) || toDate(initialStart),
        starts_at: toLocalDateTime(initialStart),
        ends_at: toLocalDateTime(initialEnd),
        timezone: event.timezone || timezone,
        color: event.color || "",
        repeat_frequency: parsedRule.FREQ?.toLowerCase() || "",
        repeat_interval: parsedRule.INTERVAL || 1,
        repeat_days: parsedRule.BYDAY?.split(",").filter((day) => day.length === 2) || [],
        monthly_pattern: parsedRule.BYDAY ? "weekday" : "date",
        repeat_end: parsedRule.UNTIL ? "until" : parsedRule.COUNT ? "count" : "never",
        repeat_until: parsedRule.UNTIL
            ? `${parsedRule.UNTIL.slice(0, 4)}-${parsedRule.UNTIL.slice(4, 6)}-${parsedRule.UNTIL.slice(6, 8)}`
            : "",
        repeat_count: parsedRule.COUNT || 10,
        reminder_offsets: event.reminders || [],
    });

    useEffect(() => {
        if (!show) return;
        const baseStart =
            form.data.scope === "series" && event.base_start ? event.base_start : initialStart;
        const editingSeries = form.data.scope === "series" && event.base_end;
        const baseEnd = editingSeries
            ? event.base_end
            : form.data.is_all_day
              ? toInclusiveAllDayEnd(initialEnd)
              : initialEnd;
        if (form.data.is_all_day) {
            form.setData((data) => ({
                ...data,
                start_date: toDate(baseStart),
                end_date: toDate(baseEnd),
            }));
        } else {
            form.setData((data) => ({
                ...data,
                starts_at: toLocalDateTime(baseStart),
                ends_at: toLocalDateTime(baseEnd),
            }));
        }
        // The form is intentionally re-seeded when the selected event changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.data.scope]);

    const submit = (eventObject) => {
        eventObject.preventDefault();
        form.transform((data) => ({
            ...data,
            recurrence_rule: buildRule(data),
        }));
        const options = {
            preserveScroll: true,
            onSuccess: onClose,
        };
        if (editing) {
            form.put(route("calendar-events.update", item.eventId), options);
        } else {
            form.post(route("calendar-events.store"), options);
        }
    };

    const remove = () => {
        if (!confirm(`Remove “${form.data.title}”?`)) return;
        router.delete(route("calendar-events.destroy", item.eventId), {
            data: {
                scope: form.data.scope,
                occurrence_key: form.data.occurrence_key,
            },
            preserveScroll: true,
            onSuccess: onClose,
        });
    };

    const applyPreset = (kind) => {
        const updates = { kind };
        if (kind === "class") {
            const date = new Date(form.data.starts_at || `${form.data.start_date}T12:00`);
            updates.repeat_frequency = "weekly";
            updates.repeat_days = [WEEKDAYS[date.getDay()][0]];
            updates.is_all_day = false;
        } else if (kind === "holiday") {
            updates.is_all_day = true;
        } else if (kind === "appointment" || kind === "event") {
            updates.repeat_frequency = "";
        } else if (kind === "routine") {
            updates.repeat_frequency = "weekly";
        }
        form.setData((data) => ({ ...data, ...updates }));
    };

    const toggleReminder = (offset) => {
        if (
            !form.data.reminder_offsets.includes(offset) &&
            form.data.reminder_offsets.length >= 5
        ) {
            return;
        }
        form.setData(
            "reminder_offsets",
            form.data.reminder_offsets.includes(offset)
                ? form.data.reminder_offsets.filter((value) => value !== offset)
                : [...form.data.reminder_offsets, offset]
        );
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="2xl" alignTop>
            <form onSubmit={submit}>
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-light-border/70 bg-light-card px-5 py-4 dark:border-dark-border/70 dark:bg-dark-card">
                    <div>
                        <h2 className="text-lg font-semibold text-light-primary dark:text-dark-primary">
                            {editing ? "Edit event" : "Add event"}
                        </h2>
                        <p className="text-xs text-light-muted dark:text-dark-muted">
                            Keep only the details that help you show up prepared.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close event form"
                        className="rounded-lg p-2 text-light-muted hover:bg-light-hover dark:text-dark-muted dark:hover:bg-dark-hover"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-6 p-5">
                    {editing && event.recurrence_rule && (
                        <fieldset>
                            <legend className="mb-2 text-sm font-medium text-light-primary dark:text-dark-primary">
                                Edit
                            </legend>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    ["occurrence", "This occurrence"],
                                    ["series", "Whole series"],
                                ].map(([value, label]) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => form.setData("scope", value)}
                                        className={`rounded-xl border px-3 py-2 text-sm ${form.data.scope === value ? "border-wevie-teal bg-wevie-teal/10 text-light-primary dark:text-dark-primary" : "border-light-border text-light-secondary dark:border-dark-border dark:text-dark-secondary"}`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </fieldset>
                    )}

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                        {["event", "class", "appointment", "holiday", "routine"].map((kind) => (
                            <button
                                key={kind}
                                type="button"
                                onClick={() => applyPreset(kind)}
                                className={`min-h-11 rounded-xl border px-2 py-2 text-xs font-medium capitalize ${form.data.kind === kind ? "border-wevie-teal bg-wevie-teal/10 text-light-primary dark:text-dark-primary" : "border-light-border text-light-secondary dark:border-dark-border dark:text-dark-secondary"}`}
                            >
                                {kind}
                            </button>
                        ))}
                    </div>

                    <div>
                        <label
                            htmlFor="event-title"
                            className="mb-1 block text-sm font-medium text-light-primary dark:text-dark-primary"
                        >
                            Title
                        </label>
                        <input
                            id="event-title"
                            value={form.data.title}
                            onChange={(e) => form.setData("title", e.target.value)}
                            className="input-primary w-full"
                            placeholder="What’s happening?"
                            required
                        />
                        {form.errors.title && (
                            <p className="mt-1 text-sm text-error-600 dark:text-error-400">
                                {form.errors.title}
                            </p>
                        )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label
                                htmlFor="event-calendar"
                                className="mb-1 block text-sm font-medium text-light-primary dark:text-dark-primary"
                            >
                                Calendar
                            </label>
                            <select
                                id="event-calendar"
                                value={form.data.event_calendar_id}
                                onChange={(e) => form.setData("event_calendar_id", e.target.value)}
                                className="input-primary w-full"
                            >
                                {calendars.map((calendar) => (
                                    <option key={calendar.id} value={calendar.id}>
                                        {calendar.name}
                                    </option>
                                ))}
                            </select>
                            {form.errors.event_calendar_id && (
                                <p className="mt-1 text-sm text-error-600 dark:text-error-400">
                                    {form.errors.event_calendar_id}
                                </p>
                            )}
                        </div>
                        <label className="flex min-h-11 items-center gap-3 self-end rounded-xl border border-light-border px-3 dark:border-dark-border">
                            <input
                                type="checkbox"
                                checked={form.data.is_all_day}
                                onChange={(e) => form.setData("is_all_day", e.target.checked)}
                                className="rounded border-light-border text-wevie-teal focus:ring-wevie-teal"
                            />
                            <span className="text-sm text-light-primary dark:text-dark-primary">
                                All day
                            </span>
                        </label>
                    </div>

                    {form.data.is_all_day ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                            <DateField
                                label="Starts"
                                value={form.data.start_date}
                                error={form.errors.start_date}
                                onChange={(value) => form.setData("start_date", value)}
                            />
                            <DateField
                                label="Ends"
                                value={form.data.end_date}
                                min={form.data.start_date}
                                error={form.errors.end_date}
                                onChange={(value) => form.setData("end_date", value)}
                            />
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                            <DateTimeField
                                label="Starts"
                                value={form.data.starts_at}
                                error={form.errors.starts_at}
                                onChange={(value) => form.setData("starts_at", value)}
                            />
                            <DateTimeField
                                label="Ends"
                                value={form.data.ends_at}
                                min={form.data.starts_at}
                                error={form.errors.ends_at}
                                onChange={(value) => form.setData("ends_at", value)}
                            />
                        </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label
                                htmlFor="event-location"
                                className="mb-1 flex items-center gap-1 text-sm font-medium text-light-primary dark:text-dark-primary"
                            >
                                <MapPin className="h-4 w-4" />
                                Location
                            </label>
                            <input
                                id="event-location"
                                value={form.data.location}
                                onChange={(e) => form.setData("location", e.target.value)}
                                className="input-primary w-full"
                                placeholder="Room, address, or online"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="event-timezone"
                                className="mb-1 block text-sm font-medium text-light-primary dark:text-dark-primary"
                            >
                                Timezone
                            </label>
                            <input
                                id="event-timezone"
                                value={form.data.timezone}
                                onChange={(e) => form.setData("timezone", e.target.value)}
                                className="input-primary w-full"
                            />
                            {form.errors.timezone && (
                                <p className="mt-1 text-sm text-error-600 dark:text-error-400">
                                    {form.errors.timezone}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="rounded-xl border border-light-border/70 p-4 dark:border-dark-border/70">
                        <div className="mb-3 flex items-center gap-2">
                            <Repeat2 className="h-4 w-4 text-wevie-teal" />
                            <h3 className="text-sm font-semibold text-light-primary dark:text-dark-primary">
                                Repeat
                            </h3>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <select
                                value={form.data.repeat_frequency}
                                onChange={(e) => form.setData("repeat_frequency", e.target.value)}
                                className="input-primary w-full text-sm"
                            >
                                <option value="">Doesn’t repeat</option>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                            </select>
                            {form.data.repeat_frequency && (
                                <input
                                    type="number"
                                    min="1"
                                    max="99"
                                    value={form.data.repeat_interval}
                                    onChange={(e) =>
                                        form.setData("repeat_interval", e.target.value)
                                    }
                                    className="input-primary w-full text-sm"
                                    aria-label="Repeat interval"
                                />
                            )}
                            {form.data.repeat_frequency && (
                                <select
                                    value={form.data.repeat_end}
                                    onChange={(e) => form.setData("repeat_end", e.target.value)}
                                    className="input-primary w-full text-sm"
                                >
                                    <option value="never">No end date</option>
                                    <option value="until">Until date</option>
                                    <option value="count">Number of times</option>
                                </select>
                            )}
                        </div>
                        {form.data.repeat_frequency === "weekly" && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {WEEKDAYS.map(([code, label]) => (
                                    <button
                                        key={code}
                                        type="button"
                                        onClick={() =>
                                            form.setData(
                                                "repeat_days",
                                                form.data.repeat_days.includes(code)
                                                    ? form.data.repeat_days.filter(
                                                          (day) => day !== code
                                                      )
                                                    : [...form.data.repeat_days, code]
                                            )
                                        }
                                        className={`h-10 min-w-10 rounded-full border text-xs ${form.data.repeat_days.includes(code) ? "border-wevie-teal bg-wevie-teal text-white" : "border-light-border text-light-secondary dark:border-dark-border dark:text-dark-secondary"}`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        )}
                        {form.data.repeat_frequency === "monthly" && (
                            <select
                                value={form.data.monthly_pattern}
                                onChange={(e) => form.setData("monthly_pattern", e.target.value)}
                                className="input-primary mt-3 w-full text-sm sm:w-auto"
                            >
                                <option value="date">Same date each month</option>
                                <option value="weekday">Same weekday position</option>
                            </select>
                        )}
                        {form.data.repeat_end === "until" && (
                            <input
                                type="date"
                                value={form.data.repeat_until}
                                onChange={(e) => form.setData("repeat_until", e.target.value)}
                                className="input-primary mt-3 text-sm"
                                aria-label="Repeat until"
                            />
                        )}
                        {form.data.repeat_end === "count" && (
                            <input
                                type="number"
                                min="1"
                                max="999"
                                value={form.data.repeat_count}
                                onChange={(e) => form.setData("repeat_count", e.target.value)}
                                className="input-primary mt-3 w-28 text-sm"
                                aria-label="Occurrence count"
                            />
                        )}
                        {form.errors.recurrence_rule && (
                            <p className="mt-2 text-sm text-error-600 dark:text-error-400">
                                {form.errors.recurrence_rule}
                            </p>
                        )}
                    </div>

                    <div>
                        <h3 className="mb-2 text-sm font-semibold text-light-primary dark:text-dark-primary">
                            Reminders
                        </h3>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {REMINDERS.map(([offset, label]) => (
                                <label
                                    key={offset}
                                    className="flex min-h-11 items-center gap-3 rounded-xl border border-light-border px-3 dark:border-dark-border"
                                >
                                    <input
                                        type="checkbox"
                                        checked={form.data.reminder_offsets.includes(offset)}
                                        disabled={
                                            !form.data.reminder_offsets.includes(offset) &&
                                            form.data.reminder_offsets.length >= 5
                                        }
                                        onChange={() => toggleReminder(offset)}
                                        className="rounded text-wevie-teal focus:ring-wevie-teal disabled:opacity-40"
                                    />
                                    <span className="text-sm text-light-secondary dark:text-dark-secondary">
                                        {label}
                                    </span>
                                </label>
                            ))}
                        </div>
                        {form.errors.reminder_offsets && (
                            <p className="mt-2 text-sm text-error-600 dark:text-error-400">
                                {form.errors.reminder_offsets}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="event-notes"
                            className="mb-1 block text-sm font-medium text-light-primary dark:text-dark-primary"
                        >
                            Notes
                        </label>
                        <textarea
                            id="event-notes"
                            rows="3"
                            value={form.data.notes}
                            onChange={(e) => form.setData("notes", e.target.value)}
                            className="input-primary w-full"
                            placeholder="Anything useful to remember"
                        />
                    </div>
                </div>

                <div className="sticky bottom-0 flex items-center justify-between border-t border-light-border/70 bg-light-card px-5 py-4 dark:border-dark-border/70 dark:bg-dark-card">
                    {editing ? (
                        <button
                            type="button"
                            onClick={remove}
                            className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-900/20"
                        >
                            <Trash2 className="h-4 w-4" />
                            Remove
                        </button>
                    ) : (
                        <span />
                    )}
                    <div className="flex gap-2">
                        <button type="button" onClick={onClose} className="btn-secondary min-h-11">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="btn-primary min-h-11"
                        >
                            <CalendarDays className="mr-2 h-4 w-4" />
                            {form.processing ? "Saving…" : "Save event"}
                        </button>
                    </div>
                </div>
            </form>
        </Modal>
    );
}

function DateField({ label, value, min, onChange, error }) {
    return (
        <div>
            <label className="block text-sm font-medium text-light-primary dark:text-dark-primary">
                {label}
                <input
                    type="date"
                    value={value}
                    min={min}
                    onChange={(event) => onChange(event.target.value)}
                    className="input-primary mt-1 w-full"
                    required
                />
            </label>
            {error && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{error}</p>}
        </div>
    );
}

function DateTimeField({ label, value, min, onChange, error }) {
    return (
        <div>
            <label className="block text-sm font-medium text-light-primary dark:text-dark-primary">
                {label}
                <input
                    type="datetime-local"
                    value={value}
                    min={min}
                    onChange={(event) => onChange(event.target.value)}
                    className="input-primary mt-1 w-full"
                    required
                />
            </label>
            {error && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{error}</p>}
        </div>
    );
}

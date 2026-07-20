const WEEKDAYS = [
    { value: 0, label: "Sun" },
    { value: 1, label: "Mon" },
    { value: 2, label: "Tue" },
    { value: 3, label: "Wed" },
    { value: 4, label: "Thu" },
    { value: 5, label: "Fri" },
    { value: 6, label: "Sat" },
];

const ordinal = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};

/**
 * Extra scheduling controls shown when a recurring task repeats weekly or
 * monthly. Reads from / writes to a plain `recurrence_config` object:
 *   weekly  -> { days_of_week: [0-6] }   (0 = Sunday ... 6 = Saturday)
 *   monthly -> { day_of_month: 1-31 }
 */
export default function RecurrenceConfigFields({
    recurrenceType,
    config = {},
    onChange,
}) {
    if (recurrenceType === "weekly") {
        const selected = Array.isArray(config?.days_of_week)
            ? config.days_of_week
            : [];

        const toggleDay = (day) => {
            const next = selected.includes(day)
                ? selected.filter((d) => d !== day)
                : [...selected, day].sort((a, b) => a - b);
            onChange({ days_of_week: next });
        };

        return (
            <div>
                <label className="block text-sm font-medium mb-1 text-light-secondary dark:text-dark-secondary">
                    Repeat on
                </label>
                <div className="flex flex-wrap gap-2">
                    {WEEKDAYS.map((d) => {
                        const active = selected.includes(d.value);
                        return (
                            <button
                                type="button"
                                key={d.value}
                                onClick={() => toggleDay(d.value)}
                                aria-pressed={active}
                                className={
                                    "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors " +
                                    (active
                                        ? "bg-wevie-teal border-wevie-teal text-white dark:bg-wevie-mint dark:border-wevie-mint dark:text-gray-900"
                                        : "bg-transparent border-light-border text-light-secondary hover:border-wevie-teal dark:border-dark-border dark:text-dark-secondary dark:hover:border-wevie-mint")
                                }
                            >
                                {d.label}
                            </button>
                        );
                    })}
                </div>
                <p className="text-xs mt-1 text-light-secondary/70 dark:text-dark-secondary/70">
                    Pick one or more days. Leave empty to repeat on the day this
                    task was created.
                </p>
            </div>
        );
    }

    if (recurrenceType === "monthly") {
        const day = config?.day_of_month ?? "";

        return (
            <div>
                <label className="block text-sm font-medium mb-1 text-light-secondary dark:text-dark-secondary">
                    Repeat on day
                </label>
                <select
                    className="w-full input-primary"
                    value={day}
                    onChange={(e) =>
                        onChange({
                            day_of_month: e.target.value
                                ? parseInt(e.target.value, 10)
                                : null,
                        })
                    }
                >
                    <option value="">Day this task was created</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                            {ordinal(n)}
                        </option>
                    ))}
                </select>
                <p className="text-xs mt-1 text-light-secondary/70 dark:text-dark-secondary/70">
                    In shorter months, the last day of the month is used.
                </p>
            </div>
        );
    }

    return null;
}

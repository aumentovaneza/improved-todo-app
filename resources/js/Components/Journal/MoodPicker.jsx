export default function MoodPicker({ moods = [], value = null, onChange }) {
    return (
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Mood">
            {moods.map((mood) => {
                const selected = value === mood.value;
                return (
                    <button
                        key={mood.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => onChange?.(selected ? null : mood.value)}
                        title={mood.label}
                        className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-wevie-teal/40 ${
                            selected
                                ? "border-wevie-teal bg-primary-100 text-primary-700 dark:border-wevie-teal dark:bg-primary-900/30 dark:text-primary-300"
                                : "border-light-border/70 bg-light-card text-light-secondary hover:bg-light-hover hover:text-light-primary dark:border-dark-border/70 dark:bg-dark-card dark:text-dark-secondary dark:hover:bg-dark-hover dark:hover:text-dark-primary"
                        }`}
                    >
                        <span className="text-lg leading-none" aria-hidden="true">
                            {mood.emoji}
                        </span>
                        <span>{mood.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

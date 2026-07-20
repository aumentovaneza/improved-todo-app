/**
 * Segmented control. `tabs` accepts strings or { value, label } objects.
 * Used for date-range selectors and section switching.
 */
export default function Tabs({ tabs = [], active, onChange, className = "" }) {
    return (
        <div
            role="tablist"
            className={`inline-flex flex-wrap gap-1 rounded-xl bg-light-hover p-1 dark:bg-dark-hover ${className}`}
        >
            {tabs.map((tab) => {
                const value = tab.value ?? tab;
                const label = tab.label ?? tab;
                const isActive = value === active;
                return (
                    <button
                        key={value}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => onChange?.(value)}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                            isActive
                                ? "bg-white text-light-primary shadow-soft dark:bg-dark-card dark:text-dark-primary"
                                : "text-light-muted hover:text-light-primary dark:text-dark-muted dark:hover:text-dark-primary"
                        }`}
                    >
                        {label}
                    </button>
                );
            })}
        </div>
    );
}

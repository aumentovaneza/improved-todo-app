/**
 * Friendly empty state with an icon, message, and optional call-to-action.
 * Replaces the bare one-line "Nothing recorded yet." placeholders.
 */
export default function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    className = "",
}) {
    return (
        <div
            className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-light-border px-6 py-10 text-center dark:border-dark-border ${className}`}
        >
            {Icon && (
                <div className="mb-3 rounded-full bg-wevie-teal/10 p-3 text-wevie-teal">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
            )}
            <p className="text-sm font-semibold text-light-primary dark:text-dark-primary">
                {title}
            </p>
            {description && (
                <p className="mt-1 max-w-xs text-sm text-light-muted dark:text-dark-muted">
                    {description}
                </p>
            )}
            {actionLabel && onAction && (
                <button
                    type="button"
                    onClick={onAction}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-wevie-teal to-wevie-mint px-4 py-2 text-sm font-medium text-white shadow-soft hover:opacity-90"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
}

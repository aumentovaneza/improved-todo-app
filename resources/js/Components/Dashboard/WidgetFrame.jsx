import { GripVertical } from "lucide-react";

/**
 * Shared shell for every dashboard widget. Built on the `.card` token with the
 * header/actions pattern borrowed from Finance's ChartWrapper: a title, an
 * optional icon, an optional right-aligned action slot, an accessible drag
 * handle, and the widget body as children.
 *
 * `dragHandleProps` carries dnd-kit's `attributes` + `listeners`; when absent
 * (e.g. previewing outside the sortable grid) the handle is simply not shown.
 */
export default function WidgetFrame({
    title,
    icon: Icon,
    iconClassName = "bg-wevie-teal/10 text-wevie-teal",
    action,
    dragHandleProps,
    children,
    className = "",
    contentClassName = "",
}) {
    return (
        <section className={`card flex h-full flex-col ${className}`} aria-label={title}>
            <header className="flex items-center justify-between gap-2 border-b border-light-border/70 px-4 py-3 dark:border-dark-border/70 sm:px-5">
                <div className="flex min-w-0 items-center gap-2">
                    {dragHandleProps && (
                        <button
                            type="button"
                            {...dragHandleProps}
                            aria-label={`Drag to reorder ${title}`}
                            className="hidden flex-shrink-0 cursor-grab touch-none rounded-md p-1 text-light-muted transition-colors hover:bg-light-hover hover:text-light-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-wevie-teal/40 active:cursor-grabbing dark:text-dark-muted dark:hover:bg-dark-hover dark:hover:text-dark-secondary sm:block"
                        >
                            <GripVertical className="h-4 w-4" aria-hidden="true" />
                        </button>
                    )}
                    {Icon && (
                        <span
                            className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${iconClassName}`}
                            aria-hidden="true"
                        >
                            <Icon className="h-4 w-4" />
                        </span>
                    )}
                    <h3 className="truncate text-sm font-semibold text-adaptive-primary sm:text-base">
                        {title}
                    </h3>
                </div>
                {action && <div className="flex flex-shrink-0 items-center gap-1">{action}</div>}
            </header>
            <div className={`flex-1 p-4 sm:p-5 ${contentClassName}`}>{children}</div>
        </section>
    );
}

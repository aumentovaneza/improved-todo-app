import { router } from "@inertiajs/react";
import { formatDistanceToNow } from "date-fns";
import { X } from "lucide-react";

/**
 * Formats an ISO timestamp as a relative "x ago" string, guarding against
 * malformed dates coming back from the API.
 */
function relativeTime(iso) {
    if (!iso) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * A single notification row, shared by the bell popover and the full-history
 * page. Owns its own read/delete/navigate side effects and reports back so the
 * parent can update its local list optimistically. Uses `preserveState` +
 * `preserveScroll` so the shared `auth.unreadNotifications` badge refreshes
 * without a full page reload.
 */
export default function NotificationItem({
    notification,
    onRead,
    onDelete,
    onNavigate,
}) {
    const data = notification.data || {};
    const isUnread = !notification.read_at;
    const title = data.title || "Notification";
    const message = data.message || "";
    const taskId = data.task_id ?? null;

    const markRead = () => {
        if (!isUnread) return;
        router.post(
            route("notifications.read", notification.id),
            {},
            { preserveScroll: true, preserveState: true }
        );
        onRead?.(notification.id);
    };

    const handleActivate = () => {
        markRead();

        if (taskId) {
            // No dedicated deep-link/route opens a specific task modal today;
            // Tasks/Index opens tasks from local state. We navigate to the
            // tasks list with the id as a query param so the page can opt in
            // to auto-opening it later.
            // TODO: teach Pages/Tasks/Index.jsx to read `?task=<id>` and open
            // the matching TaskDetail modal on mount.
            router.visit(route("tasks.index", { task: taskId }));
        }

        onNavigate?.(notification);
    };

    const handleDelete = (event) => {
        event.stopPropagation();
        router.delete(route("notifications.destroy", notification.id), {
            preserveScroll: true,
            preserveState: true,
        });
        onDelete?.(notification.id);
    };

    const onKeyDown = (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleActivate();
        }
    };

    return (
        <div
            className={`group relative flex items-start gap-3 px-4 py-3 transition-colors ${
                isUnread
                    ? "bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/20 dark:hover:bg-primary-900/30"
                    : "hover:bg-light-hover dark:hover:bg-dark-hover"
            }`}
        >
            <button
                type="button"
                onClick={handleActivate}
                onKeyDown={onKeyDown}
                className="flex flex-1 items-start gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-md"
            >
                <span
                    className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${
                        isUnread
                            ? "bg-primary-500 dark:bg-primary-400"
                            : "bg-transparent"
                    }`}
                    aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                    <span
                        className={`block truncate text-sm ${
                            isUnread
                                ? "font-semibold text-light-primary dark:text-dark-primary"
                                : "font-medium text-light-secondary dark:text-dark-secondary"
                        }`}
                    >
                        {title}
                    </span>
                    {message && (
                        <span className="mt-0.5 block text-sm text-light-secondary dark:text-dark-secondary line-clamp-2">
                            {message}
                        </span>
                    )}
                    <span className="mt-1 block text-xs text-light-muted dark:text-dark-muted">
                        {relativeTime(notification.created_at)}
                    </span>
                </span>
            </button>

            <button
                type="button"
                onClick={handleDelete}
                title="Delete notification"
                aria-label="Delete notification"
                className="mt-0.5 flex-shrink-0 rounded-md p-1 text-light-muted opacity-0 transition-opacity hover:bg-light-hover hover:text-error-500 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-error-400 group-hover:opacity-100 dark:text-dark-muted dark:hover:bg-dark-hover"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

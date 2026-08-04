import { router, usePage } from "@inertiajs/react";
import {
    Popover,
    PopoverButton,
    PopoverPanel,
} from "@headlessui/react";
import { Bell, Check, CheckCheck } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";

export default function NotificationBell() {
    const { notifications } = usePage().props;
    const items = notifications?.items ?? [];
    const unreadCount = notifications?.unread_count ?? 0;

    const markRead = (id) => {
        router.post(
            route("notifications.read", id),
            {},
            { preserveScroll: true, preserveState: true }
        );
    };

    const markAllRead = () => {
        router.post(
            route("notifications.read-all"),
            {},
            { preserveScroll: true, preserveState: true }
        );
    };

    return (
        <Popover className="relative">
            <PopoverButton className="relative rounded-md p-2 text-light-secondary hover:text-light-primary dark:text-dark-secondary dark:hover:text-dark-primary transition-colors duration-200 hover:bg-light-hover dark:hover:bg-dark-hover focus:outline-none">
                <span className="sr-only">Notifications</span>
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-4 text-white">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </PopoverButton>

            <PopoverPanel className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] origin-top-right rounded-lg border border-light-border/70 dark:border-white/10 bg-white dark:bg-dark-card shadow-lg focus:outline-none">
                <div className="flex items-center justify-between border-b border-light-border/70 dark:border-white/10 px-4 py-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        Notifications
                    </h3>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllRead}
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                        >
                            <CheckCheck className="h-3.5 w-3.5" />
                            Mark all read
                        </button>
                    )}
                </div>

                <div className="max-h-96 overflow-y-auto">
                    {items.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                            <Bell className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600" />
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                No notifications yet.
                            </p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-light-border/70 dark:divide-white/10">
                            {items.map((item) => (
                                <li
                                    key={item.id}
                                    className={`flex items-start gap-3 px-4 py-3 ${
                                        item.read
                                            ? ""
                                            : "bg-primary-50/60 dark:bg-primary-900/10"
                                    }`}
                                >
                                    <span
                                        className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${
                                            item.read
                                                ? "bg-transparent"
                                                : "bg-primary-500"
                                        }`}
                                        aria-hidden="true"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {item.title}
                                        </p>
                                        {item.body && (
                                            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                                                {item.body}
                                            </p>
                                        )}
                                        {item.created_at && (
                                            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                                                {formatDistanceToNowStrict(
                                                    new Date(item.created_at),
                                                    { addSuffix: true }
                                                )}
                                            </p>
                                        )}
                                    </div>
                                    {!item.read && (
                                        <button
                                            onClick={() => markRead(item.id)}
                                            title="Mark as read"
                                            className="flex-shrink-0 rounded p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                                        >
                                            <Check className="h-4 w-4" />
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </PopoverPanel>
        </Popover>
    );
}

import { Popover, Transition } from "@headlessui/react";
import { Link, router, usePage } from "@inertiajs/react";
import { Bell, CheckCheck, Loader2, AlertCircle } from "lucide-react";
import { Fragment, useCallback, useEffect, useState } from "react";
import NotificationItem from "./Notifications/NotificationItem";

/**
 * Panel body — mounts only when the popover opens (Headless UI unmounts the
 * panel when closed), so it fetches a fresh feed each time it's opened.
 * Handles loading / empty / error states and keeps a local copy of the list so
 * read/delete actions feel instant while Inertia refreshes the shared badge.
 */
function NotificationPanel({ close }) {
    const [items, setItems] = useState([]);
    const [status, setStatus] = useState("loading"); // loading | ready | error

    const loadFeed = useCallback(async () => {
        setStatus("loading");
        try {
            const response = await fetch(route("notifications.feed"), {
                headers: { Accept: "application/json" },
                credentials: "same-origin",
            });
            if (!response.ok) {
                throw new Error(`Request failed (${response.status})`);
            }
            const payload = await response.json();
            // Backend returns { notifications, unread_count }; also tolerate a
            // bare array or a { data } paginator-style shape.
            const list = Array.isArray(payload)
                ? payload
                : payload?.notifications ?? payload?.data ?? [];
            setItems(list);
            setStatus("ready");
        } catch {
            setStatus("error");
        }
    }, []);

    useEffect(() => {
        loadFeed();
    }, [loadFeed]);

    const handleRead = (id) => {
        setItems((prev) =>
            prev.map((n) =>
                n.id === id
                    ? { ...n, read_at: n.read_at ?? new Date().toISOString() }
                    : n
            )
        );
    };

    const handleDelete = (id) => {
        setItems((prev) => prev.filter((n) => n.id !== id));
    };

    const markAllRead = () => {
        router.post(
            route("notifications.readAll"),
            {},
            { preserveScroll: true, preserveState: true }
        );
        setItems((prev) =>
            prev.map((n) => ({
                ...n,
                read_at: n.read_at ?? new Date().toISOString(),
            }))
        );
    };

    const hasUnread = items.some((n) => !n.read_at);

    return (
        <div className="flex max-h-[70vh] flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-light-border px-4 py-3 dark:border-dark-border">
                <h2 className="text-sm font-semibold text-light-primary dark:text-dark-primary">
                    Notifications
                </h2>
                {hasUnread && (
                    <button
                        type="button"
                        onClick={markAllRead}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 dark:text-primary-400 dark:hover:bg-primary-900/30"
                    >
                        <CheckCheck className="h-3.5 w-3.5" />
                        Mark all as read
                    </button>
                )}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
                {status === "loading" && (
                    <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-light-muted dark:text-dark-muted">
                        <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
                        <span className="text-sm">Loading notifications…</span>
                    </div>
                )}

                {status === "error" && (
                    <div className="flex flex-col items-center justify-center gap-3 px-4 py-10 text-center">
                        <AlertCircle
                            className="h-7 w-7 text-error-500 dark:text-error-400"
                            aria-hidden="true"
                        />
                        <p className="text-sm text-light-secondary dark:text-dark-secondary">
                            Couldn&apos;t load notifications.
                        </p>
                        <button
                            type="button"
                            onClick={loadFeed}
                            className="rounded-md bg-primary-400 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {status === "ready" && items.length === 0 && (
                    <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
                        <Bell
                            className="h-8 w-8 text-light-muted dark:text-dark-muted"
                            aria-hidden="true"
                        />
                        <p className="text-sm font-medium text-light-primary dark:text-dark-primary">
                            No notifications yet
                        </p>
                        <p className="text-xs text-light-muted dark:text-dark-muted">
                            Due dates and reminders will show up here.
                        </p>
                    </div>
                )}

                {status === "ready" && items.length > 0 && (
                    <ul className="divide-y divide-light-border dark:divide-dark-border">
                        {items.map((notification) => (
                            <li key={notification.id}>
                                <NotificationItem
                                    notification={notification}
                                    onRead={handleRead}
                                    onDelete={handleDelete}
                                    onNavigate={() => close()}
                                />
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Footer */}
            <div className="border-t border-light-border px-4 py-2.5 text-center dark:border-dark-border">
                <Link
                    href={route("notifications.index")}
                    onClick={() => close()}
                    className="text-sm font-medium text-primary-600 transition-colors hover:text-primary-700 hover:underline dark:text-primary-400 dark:hover:text-primary-300"
                >
                    View all
                </Link>
            </div>
        </div>
    );
}

/**
 * Bell button + unread badge (from the shared `auth.unreadNotifications`
 * Inertia prop) wrapped in an accessible Headless UI popover.
 */
export default function NotificationBell() {
    const unreadCount = usePage().props.auth?.unreadNotifications ?? 0;
    const badge = unreadCount > 9 ? "9+" : String(unreadCount);

    return (
        <Popover className="relative">
            {({ close }) => (
                <>
                    <Popover.Button
                        className="relative rounded-md p-2 text-light-secondary transition-colors duration-200 hover:bg-light-hover hover:text-light-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 dark:text-dark-secondary dark:hover:bg-dark-hover dark:hover:text-dark-primary"
                        title="Notifications"
                    >
                        <span className="sr-only">
                            Notifications
                            {unreadCount > 0
                                ? ` (${unreadCount} unread)`
                                : ""}
                        </span>
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                            <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-error-500 px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-light-secondary dark:ring-dark-secondary">
                                {badge}
                            </span>
                        )}
                    </Popover.Button>

                    <Transition
                        as={Fragment}
                        enter="transition ease-out duration-150"
                        enterFrom="opacity-0 translate-y-1"
                        enterTo="opacity-100 translate-y-0"
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100 translate-y-0"
                        leaveTo="opacity-0 translate-y-1"
                    >
                        <Popover.Panel className="absolute right-0 z-40 mt-2 w-[calc(100vw-2rem)] max-w-sm origin-top-right overflow-hidden rounded-lg border border-light-border bg-light-card shadow-soft ring-1 ring-black/5 dark:border-dark-border dark:bg-dark-card sm:w-96">
                            <NotificationPanel close={close} />
                        </Popover.Panel>
                    </Transition>
                </>
            )}
        </Popover>
    );
}

import TodoLayout from "@/Layouts/TodoLayout";
import NotificationItem from "@/Components/Notifications/NotificationItem";
import { Head, Link, router } from "@inertiajs/react";
import { Bell, CheckCheck } from "lucide-react";

export default function Index({ notifications }) {
    // Laravel length-aware paginator: { data, links, ... }.
    const items = notifications?.data ?? [];
    const links = notifications?.links ?? [];
    const hasUnread = items.some((n) => !n.read_at);

    const markAllRead = () => {
        router.post(
            route("notifications.readAll"),
            {},
            { preserveScroll: true, preserveState: true }
        );
    };

    return (
        <TodoLayout
            header={
                <div className="flex flex-row items-center justify-between gap-2 md:gap-4">
                    <h2 className="flex-shrink-0 text-base font-semibold text-light-primary dark:text-dark-primary sm:text-lg md:text-xl">
                        Notifications
                    </h2>
                    {hasUnread && (
                        <button
                            type="button"
                            onClick={markAllRead}
                            className="inline-flex items-center gap-1.5 rounded-md bg-primary-400 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
                        >
                            <CheckCheck className="h-4 w-4" />
                            <span className="hidden sm:inline">
                                Mark all as read
                            </span>
                            <span className="sm:hidden">Read all</span>
                        </button>
                    )}
                </div>
            }
        >
            <Head title="Notifications" />

            <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6">
                {items.length === 0 ? (
                    <div className="card flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
                        <Bell
                            className="h-10 w-10 text-light-muted dark:text-dark-muted"
                            aria-hidden="true"
                        />
                        <p className="text-base font-medium text-light-primary dark:text-dark-primary">
                            No notifications yet
                        </p>
                        <p className="text-sm text-light-muted dark:text-dark-muted">
                            Task due dates and reminders will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="card overflow-hidden p-0">
                        <ul className="divide-y divide-light-border dark:divide-dark-border">
                            {items.map((notification) => (
                                <li key={notification.id}>
                                    <NotificationItem
                                        notification={notification}
                                        onRead={() =>
                                            router.reload({
                                                only: ["notifications"],
                                            })
                                        }
                                        onDelete={() =>
                                            router.reload({
                                                only: ["notifications"],
                                            })
                                        }
                                    />
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {links.length > 3 && (
                    <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
                        {links.map((link, index) => (
                            <Link
                                key={index}
                                href={link.url || "#"}
                                preserveScroll
                                className={`rounded-md px-3 py-2 text-xs font-medium transition-colors sm:text-sm ${
                                    link.active
                                        ? "bg-primary-400 text-white"
                                        : link.url
                                          ? "text-light-secondary hover:bg-light-hover dark:text-dark-secondary dark:hover:bg-dark-hover"
                                          : "cursor-not-allowed text-light-muted dark:text-dark-muted"
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </TodoLayout>
    );
}

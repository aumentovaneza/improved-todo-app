import { Link } from "@inertiajs/react";
import { BookOpen, CheckSquare, Home, User, Wallet } from "lucide-react";

export default function MobileTabBar() {
    const tabs = [
        {
            name: "Dashboard",
            href: route("dashboard"),
            icon: Home,
            isActive: route().current("dashboard"),
            tourKey: "mobile-nav-dashboard",
        },
        {
            name: "Wallet",
            href: route("weviewallet.dashboard"),
            icon: Wallet,
            isActive: route().current("weviewallet.*"),
            tourKey: "mobile-nav-weviewallet",
        },
        {
            name: "Journal",
            href: route("journal.index"),
            icon: BookOpen,
            isActive: route().current("journal.*"),
            tourKey: "mobile-nav-journal",
        },
        {
            name: "Tasks",
            href: route("tasks.index"),
            icon: CheckSquare,
            isActive: route().current("tasks.*"),
            tourKey: "mobile-nav-tasks",
        },
        {
            name: "Profile",
            href: route("profile.show"),
            icon: User,
            isActive: route().current("profile.*"),
            tourKey: "mobile-user-menu",
        },
    ];

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-40 border-t border-light-border/70 bg-light-secondary/95 backdrop-blur-lg dark:border-dark-border/70 dark:bg-dark-secondary/95 lg:hidden"
            aria-label="Primary"
            style={{
                paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)",
            }}
        >
            <div className="mx-auto grid max-w-md grid-cols-5 items-center gap-1 px-4 pt-2">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            data-tour={tab.tourKey}
                            className="flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-medium text-light-muted transition-colors duration-150 hover:text-light-primary dark:text-dark-muted dark:hover:text-dark-primary"
                            aria-current={tab.isActive ? "page" : undefined}
                        >
                            <Icon
                                className={`h-5 w-5 ${
                                    tab.isActive
                                        ? "text-wevie-teal"
                                        : "text-light-muted dark:text-dark-muted"
                                }`}
                            />
                            <span
                                className={`${
                                    tab.isActive ? "text-light-primary dark:text-dark-primary" : ""
                                }`}
                            >
                                {tab.name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}

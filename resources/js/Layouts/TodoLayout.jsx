import ApplicationLogo from "@/Components/ApplicationLogo";
import Dropdown from "@/Components/Dropdown";
import Toast from "@/Components/Toast";
import { FloatingPomodoroWidget, FocusMode } from "@/Components/Pomodoro";
import { Link, usePage } from "@inertiajs/react";
import { useState, useEffect } from "react";
import {
    CheckSquare,
    FolderOpen,
    Users,
    Settings,
    Activity,
    Sun,
    Moon,
    Bell,
    Home,
    Calendar,
    BarChart3,
    Menu,
    X,
} from "lucide-react";

export default function TodoLayout({ header, children }) {
    const user = usePage().props.auth.user;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(() => {
        // Check localStorage or system preference
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("darkMode");
            if (stored !== null) {
                return JSON.parse(stored);
            }
            return window.matchMedia("(prefers-color-scheme: dark)").matches;
        }
        return false;
    });

    // Apply dark mode on mount and when it changes
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
        localStorage.setItem("darkMode", JSON.stringify(darkMode));
    }, [darkMode]);

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };

    const navigation = [
        {
            name: "Dashboard",
            href: route("dashboard"),
            icon: Home,
            current: route().current("dashboard"),
        },
        {
            name: "Tasks",
            href: route("tasks.index"),
            icon: CheckSquare,
            current: route().current("tasks.*"),
        },
        {
            name: "Categories",
            href: route("categories.index"),
            icon: FolderOpen,
            current: route().current("categories.*"),
        },
        {
            name: "Workspaces",
            href: route("workspaces.index"),
            icon: Users,
            current:
                route().current("workspaces.*") || route().current("boards.*"),
        },
        {
            name: "Calendar",
            href: route("calendar.index"),
            icon: Calendar,
            current: route().current("calendar.*"),
        },
        {
            name: "Analytics",
            href: route("analytics.index"),
            icon: BarChart3,
            current: route().current("analytics.*"),
        },
    ];

    const adminNavigation = [
        {
            name: "Admin Dashboard",
            href: route("admin.dashboard"),
            icon: Settings,
            current: route().current("admin.dashboard"),
        },
        {
            name: "Users",
            href: route("admin.users.index"),
            icon: Users,
            current: route().current("admin.users.*"),
        },
        {
            name: "Invite Codes",
            href: route("admin.invite-codes.index"),
            icon: Users,
            current: route().current("admin.invite-codes.*"),
        },
        {
            name: "Activity Logs",
            href: route("admin.activity-logs.index"),
            icon: Activity,
            current: route().current("admin.activity-logs.index"),
        },
    ];

    return (
        <div
            className={`min-h-screen bg-light-primary dark:bg-dark-primary lg:flex`}
        >
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div
                        className="fixed inset-0 bg-gray-600 bg-opacity-75"
                        onClick={() => setSidebarOpen(false)}
                    />
                    <div className="relative flex h-full w-full max-w-xs flex-col bg-light-secondary dark:bg-dark-secondary shadow-xl">
                        <div className="absolute top-0 right-0 -mr-12 pt-2">
                            <button
                                type="button"
                                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                                onClick={() => setSidebarOpen(false)}
                            >
                                <span className="sr-only">Close sidebar</span>
                                <svg
                                    className="h-6 w-6 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth="1.5"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                        {/* Mobile sidebar content - copy of desktop sidebar */}
                        <div className="flex h-full flex-col overflow-y-auto">
                            {/* Sidebar Header */}
                            <div className="flex items-center justify-between h-16 px-4 border-b border-light-border dark:border-dark-border">
                                <Link href="/" className="flex items-center">
                                    <ApplicationLogo className="h-8 w-auto text-light-primary dark:text-dark-primary" />
                                    <span className="ml-2 text-lg font-semibold text-light-primary dark:text-dark-primary">
                                        Wevie
                                    </span>
                                </Link>
                            </div>
                            {/* Sidebar Content */}
                            <div className="flex-1 flex flex-col overflow-y-auto">
                                {/* Navigation */}
                                <nav className="flex-1 px-4 py-6 space-y-2">
                                    <div className="space-y-1">
                                        {navigation.map((item) => {
                                            const Icon = item.icon;
                                            return (
                                                <Link
                                                    key={item.name}
                                                    href={item.href}
                                                    onClick={() =>
                                                        setSidebarOpen(false)
                                                    }
                                                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${
                                                        item.current
                                                            ? "bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-[#2ED7A1]"
                                                            : "text-light-secondary hover:bg-light-hover hover:text-light-primary dark:text-dark-secondary dark:hover:bg-dark-hover dark:hover:text-dark-primary"
                                                    }`}
                                                >
                                                    <Icon
                                                        className={`mr-3 h-5 w-5 ${
                                                            item.current
                                                                ? "text-primary-400 dark:text-[#2ED7A1]"
                                                                : "text-light-muted group-hover:text-light-secondary dark:text-dark-muted dark:group-hover:text-dark-secondary"
                                                        }`}
                                                    />
                                                    {item.name}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                    {/* Admin Navigation */}
                                    {user.role === "admin" && (
                                        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                                            <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Admin
                                            </h3>
                                            <div className="mt-2 space-y-1">
                                                {adminNavigation.map((item) => {
                                                    const Icon = item.icon;
                                                    return (
                                                        <Link
                                                            key={item.name}
                                                            href={item.href}
                                                            onClick={() =>
                                                                setSidebarOpen(
                                                                    false
                                                                )
                                                            }
                                                            className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${
                                                                item.current
                                                                    ? "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300"
                                                                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                                                            }`}
                                                        >
                                                            <Icon
                                                                className={`mr-3 h-5 w-5 ${
                                                                    item.current
                                                                        ? "text-purple-500"
                                                                        : "text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400"
                                                                }`}
                                                            />
                                                            {item.name}
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </nav>
                                {/* User Profile */}
                                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <div className="h-8 w-8 rounded-full bg-primary-400 dark:bg-[#2ED7A1] flex items-center justify-center">
                                                <span className="text-sm font-medium text-white">
                                                    {user.name
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="ml-3 flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                                {user.name}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                {user.email}
                                            </p>
                                        </div>
                                        <div className="relative">
                                            <Dropdown>
                                                <Dropdown.Trigger>
                                                    <button className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                                        <svg
                                                            className="h-4 w-4"
                                                            fill="currentColor"
                                                            viewBox="0 0 20 20"
                                                        >
                                                            <path
                                                                fillRule="evenodd"
                                                                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                                clipRule="evenodd"
                                                            />
                                                        </svg>
                                                    </button>
                                                </Dropdown.Trigger>
                                                <Dropdown.Content
                                                    align="right"
                                                    className="bottom-full mb-2"
                                                >
                                                    <Dropdown.Link
                                                        href={route(
                                                            "profile.show"
                                                        )}
                                                        onClick={() =>
                                                            setSidebarOpen(
                                                                false
                                                            )
                                                        }
                                                    >
                                                        Profile
                                                    </Dropdown.Link>
                                                    <Dropdown.Link
                                                        href={route("logout")}
                                                        method="post"
                                                        as="button"
                                                        onClick={() =>
                                                            setSidebarOpen(
                                                                false
                                                            )
                                                        }
                                                    >
                                                        Log Out
                                                    </Dropdown.Link>
                                                </Dropdown.Content>
                                            </Dropdown>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-64 h-screen bg-light-secondary dark:bg-dark-secondary shadow-lg flex-col fixed left-0 top-0 z-30">
                {/* Sidebar Header */}
                <div className="flex items-center justify-between h-16 px-4 border-b border-light-border dark:border-dark-border">
                    <Link href="/" className="flex items-center">
                        <ApplicationLogo className="h-8 w-auto text-light-primary dark:text-dark-primary" />
                        <span className="ml-2 text-lg font-semibold text-light-primary dark:text-dark-primary">
                            Wevie
                        </span>
                    </Link>
                </div>
                {/* Sidebar Content */}
                <div className="flex-1 flex flex-col overflow-y-auto">
                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-2">
                        <div className="space-y-1">
                            {navigation.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${
                                            item.current
                                                ? "bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300"
                                                : "text-light-secondary hover:bg-light-hover hover:text-light-primary dark:text-dark-secondary dark:hover:bg-dark-hover dark:hover:text-dark-primary"
                                        }`}
                                    >
                                        <Icon
                                            className={`mr-3 h-5 w-5 ${
                                                item.current
                                                    ? "text-primary-500"
                                                    : "text-light-muted group-hover:text-light-secondary dark:text-dark-muted dark:group-hover:text-dark-secondary"
                                            }`}
                                        />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </div>
                        {/* Admin Navigation */}
                        {user.role === "admin" && (
                            <div className="pt-6 border-t border-light-border dark:border-dark-border">
                                <h3 className="px-3 text-xs font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider">
                                    Admin
                                </h3>
                                <div className="mt-2 space-y-1">
                                    {adminNavigation.map((item) => {
                                        const Icon = item.icon;
                                        return (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${
                                                    item.current
                                                        ? "bg-accent-200 text-accent-800 dark:bg-accent-900/20 dark:text-accent-300"
                                                        : "text-light-secondary hover:bg-light-hover hover:text-light-primary dark:text-dark-secondary dark:hover:bg-dark-hover dark:hover:text-dark-primary"
                                                }`}
                                            >
                                                <Icon
                                                    className={`mr-3 h-5 w-5 ${
                                                        item.current
                                                            ? "text-accent-600"
                                                            : "text-light-muted group-hover:text-light-secondary dark:text-dark-muted dark:group-hover:text-dark-secondary"
                                                    }`}
                                                />
                                                {item.name}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </nav>
                    {/* User Profile */}
                    <div className="border-t border-light-border dark:border-dark-border p-4">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="h-8 w-8 rounded-full bg-primary-400 dark:bg-[#2ED7A1] flex items-center justify-center">
                                    <span className="text-sm font-medium text-white">
                                        {user.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            <div className="ml-3 flex-1 min-w-0">
                                <p className="text-sm font-medium text-light-primary dark:text-dark-primary truncate">
                                    {user.name}
                                </p>
                                <p className="text-xs text-light-muted dark:text-dark-muted truncate">
                                    {user.email}
                                </p>
                            </div>
                            <div className="relative">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <button className="p-1 rounded-md text-light-muted hover:text-light-secondary dark:text-dark-muted dark:hover:text-dark-secondary">
                                            <svg
                                                className="h-4 w-4"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </button>
                                    </Dropdown.Trigger>
                                    <Dropdown.Content
                                        align="right"
                                        className="bottom-full mb-2"
                                    >
                                        <Dropdown.Link
                                            href={route("profile.show")}
                                        >
                                            Profile
                                        </Dropdown.Link>
                                        <Dropdown.Link
                                            href={route("logout")}
                                            method="post"
                                            as="button"
                                        >
                                            Log Out
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-screen w-full lg:ml-64">
                {/* Top Navigation Bar */}
                <header className="sticky top-0 z-10 bg-light-secondary dark:bg-dark-secondary border-b border-light-border dark:border-dark-border">
                    <div className="flex items-center justify-between min-h-14 h-auto py-3 sm:h-16 sm:py-0 px-2 sm:px-6 lg:px-8">
                        <div className="flex items-center">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-2 rounded-md text-light-muted hover:text-light-primary dark:text-dark-muted dark:hover:text-dark-primary hover:bg-light-hover dark:hover:bg-dark-hover transition-colors duration-200"
                            >
                                <Menu className="h-5 w-5" />
                            </button>
                            {header && (
                                <div className="ml-4 lg:ml-0 text-lg font-semibold text-light-primary dark:text-dark-primary">
                                    {header}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center space-x-4">
                            {/* Dark mode toggle */}
                            <button
                                onClick={toggleDarkMode}
                                className="rounded-md p-2 text-light-secondary hover:text-light-primary dark:text-dark-secondary dark:hover:text-dark-primary transition-colors duration-200 hover:bg-light-hover dark:hover:bg-dark-hover"
                                title={
                                    darkMode
                                        ? "Switch to light mode"
                                        : "Switch to dark mode"
                                }
                            >
                                {darkMode ? (
                                    <Sun className="h-5 w-5" />
                                ) : (
                                    <Moon className="h-5 w-5" />
                                )}
                            </button>
                            {/* Notifications */}
                            <button className="rounded-md p-2 text-light-secondary hover:text-light-primary dark:text-dark-secondary dark:hover:text-dark-primary transition-colors duration-200 hover:bg-light-hover dark:hover:bg-dark-hover">
                                <Bell className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </header>
                {/* Page Content */}
                <main className="flex-1 p-6">
                    <div className="mx-auto w-full max-w-7xl">{children}</div>
                </main>
            </div>

            {/* Toast Notification */}
            <Toast />

            {/* Pomodoro Components */}
            <FloatingPomodoroWidget />
            <FocusMode />
        </div>
    );
}

import ApplicationLogo from "@/Components/ApplicationLogo";
import Dropdown from "@/Components/Dropdown";
import Toast from "@/Components/Toast";
import { Link, usePage } from "@inertiajs/react";
import { useState } from "react";
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
    const [darkMode, setDarkMode] = useState(false);

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
        document.documentElement.classList.toggle("dark");
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
        { name: "Calendar", href: "#", icon: Calendar, current: false },
        { name: "Analytics", href: "#", icon: BarChart3, current: false },
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
            name: "Categories",
            href: route("admin.categories.index"),
            icon: FolderOpen,
            current: route().current("admin.categories.index"),
        },
        {
            name: "Activity Logs",
            href: route("admin.activity-logs.index"),
            icon: Activity,
            current: route().current("admin.activity-logs.index"),
        },
    ];

    return (
        <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 flex`}>
            {/* Sidebar */}
            <aside className="w-64 min-h-screen bg-white dark:bg-gray-800 shadow-lg flex flex-col">
                {/* Sidebar Header */}
                <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
                    <Link href="/" className="flex items-center">
                        <ApplicationLogo className="h-8 w-auto fill-current text-gray-800 dark:text-gray-200" />
                        <span className="ml-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                            TodoApp
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
                                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                                                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                                        }`}
                                    >
                                        <Icon
                                            className={`mr-3 h-5 w-5 ${
                                                item.current
                                                    ? "text-blue-500"
                                                    : "text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400"
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
                                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                                    <span className="text-sm font-medium text-white">
                                        {user.name.charAt(0).toUpperCase()}
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
                                <Dropdown.Content>
                                    <Dropdown.Link href={route("profile.edit")}>
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
            </aside>
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Top Navigation Bar */}
                <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <Menu className="h-5 w-5" />
                            </button>
                            {header && (
                                <h1 className="ml-4 lg:ml-0 text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    {header}
                                </h1>
                            )}
                        </div>
                        <div className="flex items-center space-x-4">
                            {/* Dark mode toggle */}
                            <button
                                onClick={toggleDarkMode}
                                className="rounded-md p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                {darkMode ? (
                                    <Sun className="h-5 w-5" />
                                ) : (
                                    <Moon className="h-5 w-5" />
                                )}
                            </button>
                            {/* Notifications */}
                            <button className="rounded-md p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
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
        </div>
    );
}

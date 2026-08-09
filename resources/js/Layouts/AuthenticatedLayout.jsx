import ApplicationLogo from "@/Components/ApplicationLogo";
import Avatar from "@/Components/Avatar/Avatar";
import Dropdown from "@/Components/Dropdown";
import NavLink from "@/Components/NavLink";
import OnboardingTour from "@/Components/OnboardingTour";
import PointsBadge from "@/Components/Points/PointsBadge";
import ResponsiveNavLink from "@/Components/ResponsiveNavLink";
import { FloatingPomodoroWidget, FocusMode } from "@/Components/Pomodoro";
import { Link, usePage } from "@inertiajs/react";
import { ShoppingBag } from "lucide-react";
import { useState } from "react";

export default function AuthenticatedLayout({ header, children }) {
    const auth = usePage().props.auth;
    const user = auth.user;
    const isFinanceRoute =
        route().current("finance.*") || route().current("weviewallet.*");

    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <nav className="border-b border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between">
                        <div className="flex">
                            <div className="flex shrink-0 items-center">
                                <Link href={route("dashboard")}>
                                    <ApplicationLogo className="block h-9 w-auto text-gray-800 dark:text-gray-200" />
                                </Link>
                            </div>

                            <div className="hidden space-x-8 sm:-my-px sm:ms-10 sm:flex">
                                <span data-tour="nav-dashboard">
                                    <NavLink
                                        href={route("dashboard")}
                                        active={route().current("dashboard")}
                                    >
                                        Dashboard
                                    </NavLink>
                                </span>
                                <span data-tour="nav-tasks">
                                    <NavLink
                                        href={route("tasks.index")}
                                        active={route().current("tasks.*")}
                                    >
                                        Tasks
                                    </NavLink>
                                </span>
                                <span data-tour="nav-categories">
                                    <NavLink
                                        href={route("categories.index")}
                                        active={route().current("categories.*")}
                                    >
                                        Categories
                                    </NavLink>
                                </span>
                                <span data-tour="nav-workspaces">
                                    <NavLink
                                        href={route("workspaces.index")}
                                        active={
                                            route().current("workspaces.*") ||
                                            route().current("boards.*")
                                        }
                                    >
                                        Workspaces
                                    </NavLink>
                                </span>
                                <span data-tour="nav-weviewallet">
                                    <NavLink
                                        href={route("weviewallet.dashboard")}
                                        active={route().current("finance.*")}
                                    >
                                        WevieWallet
                                    </NavLink>
                                </span>
                                <span data-tour="nav-store">
                                    <NavLink
                                        href={route("store.index")}
                                        active={route().current("store.*")}
                                    >
                                        <ShoppingBag className="me-1.5 h-4 w-4" aria-hidden="true" />
                                        Store
                                    </NavLink>
                                </span>
                            </div>
                        </div>

                        <div className="hidden sm:ms-6 sm:flex sm:items-center">
                            <PointsBadge className="me-3" />
                            <div className="relative ms-3" data-tour="user-menu">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <span className="inline-flex rounded-md">
                                            <button
                                                type="button"
                                                className="inline-flex items-center rounded-md border border-transparent bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-500 transition duration-150 ease-in-out hover:text-gray-700 focus:outline-none dark:bg-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                                            >
                                                <Avatar
                                                    avatar={auth.avatar}
                                                    size="sm"
                                                    className="me-2"
                                                />
                                                {user.name}

                                                <svg
                                                    className="-me-0.5 ms-2 h-4 w-4"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </button>
                                        </span>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content>
                                        <Dropdown.Link
                                            href={route("profile.show")}
                                        >
                                            Profile
                                        </Dropdown.Link>
                                        <Dropdown.Link
                                            href={route("tutorials.reset", {
                                                key: "onboarding",
                                            })}
                                            method="post"
                                            as="button"
                                        >
                                            Replay tour
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

                        <div className="-me-2 flex items-center sm:hidden">
                            <button
                                onClick={() =>
                                    setShowingNavigationDropdown(
                                        (previousState) => !previousState
                                    )
                                }
                                className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 transition duration-150 ease-in-out hover:bg-gray-100 hover:text-gray-500 focus:bg-gray-100 focus:text-gray-500 focus:outline-none dark:text-gray-500 dark:hover:bg-gray-900 dark:hover:text-gray-400 dark:focus:bg-gray-900 dark:focus:text-gray-400"
                            >
                                <svg
                                    className="h-6 w-6"
                                    stroke="currentColor"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        className={
                                            !showingNavigationDropdown
                                                ? "inline-flex"
                                                : "hidden"
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                    <path
                                        className={
                                            showingNavigationDropdown
                                                ? "inline-flex"
                                                : "hidden"
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div
                    className={
                        (showingNavigationDropdown ? "block" : "hidden") +
                        " sm:hidden"
                    }
                >
                    <div className="space-y-1 pb-3 pt-2">
                        <ResponsiveNavLink
                            href={route("dashboard")}
                            active={route().current("dashboard")}
                        >
                            Dashboard
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route("tasks.index")}
                            active={route().current("tasks.*")}
                        >
                            Tasks
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route("categories.index")}
                            active={route().current("categories.*")}
                        >
                            Categories
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route("workspaces.index")}
                            active={
                                route().current("workspaces.*") ||
                                route().current("boards.*")
                            }
                        >
                            Workspaces
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route("weviewallet.dashboard")}
                            active={route().current("finance.*")}
                        >
                            WevieWallet
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route("store.index")}
                            active={route().current("store.*")}
                        >
                            Store
                        </ResponsiveNavLink>
                    </div>

                    <div className="border-t border-gray-200 pb-1 pt-4 dark:border-gray-600">
                        <div className="flex items-center gap-3 px-4">
                            <Avatar avatar={auth.avatar} size="sm" />
                            <div className="min-w-0 flex-1">
                                <div className="text-base font-medium text-gray-800 dark:text-gray-200">
                                    {user.name}
                                </div>
                                <div className="text-sm font-medium text-gray-500">
                                    {user.email}
                                </div>
                            </div>
                            <PointsBadge />
                        </div>

                        <div className="mt-3 space-y-1">
                            <ResponsiveNavLink href={route("profile.show")}>
                                Profile
                            </ResponsiveNavLink>
                            <ResponsiveNavLink
                                method="post"
                                href={route("logout")}
                                as="button"
                            >
                                Log Out
                            </ResponsiveNavLink>
                        </div>
                    </div>
                </div>
            </nav>

            {header && (
                <header className="bg-white shadow dark:bg-gray-800">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            <main>{children}</main>

            {!isFinanceRoute && (
                <div className="hidden lg:block">
                    {/* Pomodoro Components */}
                    <FloatingPomodoroWidget />
                    <FocusMode />
                </div>
            )}

            <OnboardingTour />
        </div>
    );
}

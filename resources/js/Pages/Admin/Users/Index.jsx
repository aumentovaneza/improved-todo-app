import TodoLayout from "@/Layouts/TodoLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import {
    Plus,
    Search,
    Filter,
    Edit,
    Trash2,
    Users,
    Shield,
    User,
    Calendar,
    Activity,
} from "lucide-react";
import { toast } from "react-toastify";
import Toast from "@/Components/Toast";

export default function Index({ users, filters }) {
    const [search, setSearch] = useState(filters.search || "");
    const [roleFilter, setRoleFilter] = useState(filters.role || "");
    const [showFilters, setShowFilters] = useState(false);

    const handleSearch = (value) => {
        setSearch(value);
        router.get(
            route("admin.users.index"),
            {
                search: value,
                role: roleFilter,
            },
            {
                preserveState: true,
                replace: true,
            }
        );
    };

    const handleFilter = (type, value) => {
        if (type === "role") {
            setRoleFilter(value);
        }

        router.get(
            route("admin.users.index"),
            {
                search,
                role: type === "role" ? value : roleFilter,
            },
            {
                preserveState: true,
                replace: true,
            }
        );
    };

    const deleteUser = (user) => {
        if (confirm(`Are you sure you want to delete ${user.name}?`)) {
            router.delete(route("admin.users.destroy", user.id), {
                onSuccess: () => {
                    toast.success("User deleted successfully");
                },
                onError: (errors) => {
                    toast.error(errors.message || "Failed to delete user");
                },
            });
        }
    };

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case "admin":
                return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300";
            case "member":
                return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case "admin":
                return <Shield className="h-4 w-4" />;
            case "member":
                return <User className="h-4 w-4" />;
            default:
                return <Users className="h-4 w-4" />;
        }
    };

    return (
        <TodoLayout
            header={
                <div className="flex flex-row items-center justify-between gap-2 md:gap-4">
                    <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100 flex-shrink-0">
                        User Management
                    </h2>
                    <Link
                        href={route("admin.users.create")}
                        className="inline-flex items-center justify-center w-auto px-3 py-2 sm:px-2 sm:py-1.5 md:px-4 md:py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs sm:text-xs md:text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                    >
                        <Plus className="mr-1 sm:mr-2 h-4 w-4 sm:h-3 sm:w-3 md:h-4 md:w-4" />
                        <span className="hidden sm:inline">New User</span>
                        <span className="sm:hidden">Add</span>
                    </Link>
                </div>
            }
        >
            <Head title="User Management" />

            <div className="space-y-4 sm:space-y-6">
                {/* Search and Filters */}
                <div className="card p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={search}
                                    onChange={(e) =>
                                        handleSearch(e.target.value)
                                    }
                                    className="w-full pl-10 pr-4 py-2 border border-light-border/70 dark:border-white/10 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-dark-card dark:text-white text-sm sm:text-base"
                                />
                            </div>
                        </div>

                        {/* Filter Toggle */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-light-border/70 dark:border-white/10 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-dark-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <Filter className="mr-2 h-4 w-4" />
                            Filters
                        </button>
                    </div>

                    {/* Filter Options */}
                    {showFilters && (
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            {/* Role Filter */}
                            <select
                                value={roleFilter}
                                onChange={(e) =>
                                    handleFilter("role", e.target.value)
                                }
                                className="block w-full border border-light-border/70 dark:border-white/10 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-dark-card dark:text-white"
                            >
                                <option value="">All Roles</option>
                                <option value="admin">Admin</option>
                                <option value="member">Member</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* Users List */}
                <div className="card">
                    {users.data.length === 0 ? (
                        <div className="p-6 sm:p-8 text-center">
                            <div className="text-gray-400 dark:text-gray-500 mb-4">
                                <Users className="mx-auto h-10 w-10 sm:h-12 sm:w-12" />
                            </div>
                            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                                No users found
                            </h3>
                            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4">
                                {search || roleFilter
                                    ? "Try adjusting your filters or search terms."
                                    : "Get started by creating your first user."}
                            </p>
                            {!search && !roleFilter && (
                                <Link
                                    href={route("admin.users.create")}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create User
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-white/10">
                                <thead className="bg-gray-50 dark:bg-dark-card/70">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            User
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Role
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Tasks
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Activity
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Joined
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-white/10">
                                    {users.data.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                                                            <span className="text-sm font-medium text-white">
                                                                {user.name
                                                                    .charAt(0)
                                                                    .toUpperCase()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                            {user.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                                            {user.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                                                        user.role
                                                    )}`}
                                                >
                                                    {getRoleIcon(user.role)}
                                                    <span className="ml-1 capitalize">
                                                        {user.role}
                                                    </span>
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                <div className="flex items-center">
                                                    <Activity className="h-4 w-4 mr-1" />
                                                    {user.tasks_count || 0}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                <div className="flex items-center">
                                                    <Activity className="h-4 w-4 mr-1" />
                                                    {user.activity_logs_count ||
                                                        0}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                <div className="flex items-center">
                                                    <Calendar className="h-4 w-4 mr-1" />
                                                    {new Date(
                                                        user.created_at
                                                    ).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <Link
                                                        href={route(
                                                            "admin.users.edit",
                                                            user.id
                                                        )}
                                                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() =>
                                                            deleteUser(user)
                                                        }
                                                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {users.links && users.links.length > 3 && (
                    <div className="card p-4 sm:p-6">
                        <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
                            {users.links.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.url || "#"}
                                    className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                                        link.active
                                            ? "bg-blue-600 text-white"
                                            : link.url
                                            ? "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-hover"
                                            : "text-gray-400 dark:text-gray-500 cursor-not-allowed"
                                    }`}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <Toast />
        </TodoLayout>
    );
}

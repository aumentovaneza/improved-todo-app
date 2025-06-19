import { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import TodoLayout from "@/Layouts/TodoLayout";
import {
    Activity,
    User,
    Filter,
    Search,
    Calendar,
    Eye,
    AlertCircle,
} from "lucide-react";

export default function Index({
    logs = { data: [], links: [] },
    users = [],
    filters = {},
}) {
    const [searchTerm, setSearchTerm] = useState(filters.search || "");
    const [selectedUser, setSelectedUser] = useState(filters.user_id || "");
    const [selectedAction, setSelectedAction] = useState(filters.action || "");
    const [selectedModel, setSelectedModel] = useState(
        filters.model_type || ""
    );

    const handleSearch = (e) => {
        e.preventDefault();
        try {
            router.get(
                route("admin.activity-logs.index"),
                {
                    search: searchTerm,
                    user_id: selectedUser,
                    action: selectedAction,
                    model_type: selectedModel,
                },
                {
                    preserveState: true,
                    replace: true,
                }
            );
        } catch (error) {
            console.error("Error handling search:", error);
        }
    };

    const clearFilters = () => {
        setSearchTerm("");
        setSelectedUser("");
        setSelectedAction("");
        setSelectedModel("");
        try {
            router.get(
                route("admin.activity-logs.index"),
                {},
                {
                    preserveState: true,
                    replace: true,
                }
            );
        } catch (error) {
            console.error("Error clearing filters:", error);
        }
    };

    const getActionIcon = (action) => {
        switch (action) {
            case "create":
                return (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                );
            case "update":
                return <div className="w-2 h-2 bg-blue-500 rounded-full"></div>;
            case "delete":
                return <div className="w-2 h-2 bg-red-500 rounded-full"></div>;
            default:
                return <div className="w-2 h-2 bg-gray-500 rounded-full"></div>;
        }
    };

    const getActionColor = (action) => {
        switch (action) {
            case "create":
                return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
            case "update":
                return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
            case "delete":
                return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    return (
        <TodoLayout header="Activity Logs">
            <Head title="Activity Logs" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Activity className="h-8 w-8 text-accent-600" />
                        <div>
                            <h1 className="text-2xl font-bold text-light-primary dark:text-dark-primary">
                                Activity Logs
                            </h1>
                            <p className="text-light-secondary dark:text-dark-secondary">
                                Monitor system activity and user actions
                            </p>
                        </div>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-light-secondary dark:bg-dark-secondary rounded-lg p-6 shadow-sm">
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Search */}
                            <div>
                                <label className="block text-sm font-medium text-light-primary dark:text-dark-primary mb-2">
                                    Search Description
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-light-muted dark:text-dark-muted" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                        placeholder="Search activity..."
                                        className="w-full pl-10 pr-4 py-2 border border-light-border dark:border-dark-border rounded-md bg-light-primary dark:bg-dark-primary text-light-primary dark:text-dark-primary focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* User Filter */}
                            <div>
                                <label className="block text-sm font-medium text-light-primary dark:text-dark-primary mb-2">
                                    User
                                </label>
                                <select
                                    value={selectedUser}
                                    onChange={(e) =>
                                        setSelectedUser(e.target.value)
                                    }
                                    className="w-full px-3 py-2 border border-light-border dark:border-dark-border rounded-md bg-light-primary dark:bg-dark-primary text-light-primary dark:text-dark-primary focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                >
                                    <option value="">All Users</option>
                                    {users.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Action Filter */}
                            <div>
                                <label className="block text-sm font-medium text-light-primary dark:text-dark-primary mb-2">
                                    Action
                                </label>
                                <select
                                    value={selectedAction}
                                    onChange={(e) =>
                                        setSelectedAction(e.target.value)
                                    }
                                    className="w-full px-3 py-2 border border-light-border dark:border-dark-border rounded-md bg-light-primary dark:bg-dark-primary text-light-primary dark:text-dark-primary focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                >
                                    <option value="">All Actions</option>
                                    <option value="create">Create</option>
                                    <option value="update">Update</option>
                                    <option value="delete">Delete</option>
                                </select>
                            </div>

                            {/* Model Type Filter */}
                            <div>
                                <label className="block text-sm font-medium text-light-primary dark:text-dark-primary mb-2">
                                    Model Type
                                </label>
                                <select
                                    value={selectedModel}
                                    onChange={(e) =>
                                        setSelectedModel(e.target.value)
                                    }
                                    className="w-full px-3 py-2 border border-light-border dark:border-dark-border rounded-md bg-light-primary dark:bg-dark-primary text-light-primary dark:text-dark-primary focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                >
                                    <option value="">All Models</option>
                                    <option value="User">User</option>
                                    <option value="Task">Task</option>
                                    <option value="Category">Category</option>
                                    <option value="Subtask">Subtask</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <button
                                type="submit"
                                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors duration-200"
                            >
                                <Filter className="h-4 w-4" />
                                <span>Apply Filters</span>
                            </button>
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="flex items-center space-x-2 px-4 py-2 bg-light-secondary dark:bg-dark-secondary text-light-primary dark:text-dark-primary border border-light-border dark:border-dark-border rounded-md hover:bg-light-hover dark:hover:bg-dark-hover transition-colors duration-200"
                            >
                                <span>Clear Filters</span>
                            </button>
                        </div>
                    </form>
                </div>

                {/* Activity Logs Table */}
                <div className="bg-light-secondary dark:bg-dark-secondary rounded-lg shadow-sm overflow-hidden">
                    <div className="max-h-[70vh] overflow-y-auto">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-light-border dark:divide-dark-border">
                                <thead className="bg-light-hover dark:bg-dark-hover">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-light-muted dark:text-dark-muted uppercase tracking-wider">
                                            Action
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-light-muted dark:text-dark-muted uppercase tracking-wider">
                                            User
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-light-muted dark:text-dark-muted uppercase tracking-wider">
                                            Description
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-light-muted dark:text-dark-muted uppercase tracking-wider">
                                            Model
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-light-muted dark:text-dark-muted uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-light-muted dark:text-dark-muted uppercase tracking-wider">
                                            IP Address
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-light-border dark:divide-dark-border">
                                    {logs.data.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="6"
                                                className="px-6 py-12 text-center"
                                            >
                                                <div className="flex flex-col items-center space-y-2">
                                                    <AlertCircle className="h-12 w-12 text-light-muted dark:text-dark-muted" />
                                                    <p className="text-light-secondary dark:text-dark-secondary">
                                                        No activity logs found
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        logs.data.map((log) => (
                                            <tr
                                                key={log.id}
                                                className="hover:bg-light-hover dark:hover:bg-dark-hover"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center space-x-2">
                                                        {getActionIcon(
                                                            log.action
                                                        )}
                                                        <span
                                                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(
                                                                log.action
                                                            )}`}
                                                        >
                                                            {log.action}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="h-6 w-6 rounded-full bg-primary-500 flex items-center justify-center">
                                                            <span className="text-xs font-medium text-white">
                                                                {log.user
                                                                    ? log.user.name
                                                                          .charAt(
                                                                              0
                                                                          )
                                                                          .toUpperCase()
                                                                    : "?"}
                                                            </span>
                                                        </div>
                                                        <span className="text-sm text-light-primary dark:text-dark-primary">
                                                            {log.user
                                                                ? log.user.name
                                                                : "Unknown User"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-light-primary dark:text-dark-primary max-w-xs truncate">
                                                        {log.description}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm text-light-secondary dark:text-dark-secondary">
                                                        {log.model_type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center space-x-1 text-sm text-light-secondary dark:text-dark-secondary">
                                                        <Calendar className="h-4 w-4" />
                                                        <span>
                                                            {formatDate(
                                                                log.created_at
                                                            )}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm text-light-secondary dark:text-dark-secondary font-mono">
                                                        {log.ip_address}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {logs.links && logs.links.length > 3 && (
                        <div className="px-6 py-4 border-t border-light-border dark:border-dark-border">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-light-secondary dark:text-dark-secondary">
                                    Showing {logs.from} to {logs.to} of{" "}
                                    {logs.total} results
                                </div>
                                <div className="flex items-center space-x-2">
                                    {logs.links.map((link, index) => {
                                        if (!link.url) {
                                            return (
                                                <span
                                                    key={index}
                                                    className="px-3 py-2 text-sm rounded-md bg-light-secondary dark:bg-dark-secondary text-light-muted dark:text-dark-muted cursor-not-allowed"
                                                    dangerouslySetInnerHTML={{
                                                        __html: link.label,
                                                    }}
                                                />
                                            );
                                        }

                                        return (
                                            <Link
                                                key={index}
                                                href={link.url}
                                                className={`px-3 py-2 text-sm rounded-md transition-colors duration-200 ${
                                                    link.active
                                                        ? "bg-primary-600 text-white"
                                                        : "bg-light-secondary dark:bg-dark-secondary text-light-primary dark:text-dark-primary hover:bg-light-hover dark:hover:bg-dark-hover border border-light-border dark:border-dark-border"
                                                }`}
                                                dangerouslySetInnerHTML={{
                                                    __html: link.label,
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </TodoLayout>
    );
}

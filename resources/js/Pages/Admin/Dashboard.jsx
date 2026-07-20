import TodoLayout from "@/Layouts/TodoLayout";
import { Head, Link } from "@inertiajs/react";
import {
    Users,
    CheckSquare,
    FolderOpen,
    TrendingUp,
    Clock,
    AlertTriangle,
    CheckCircle,
} from "lucide-react";

export default function Dashboard({ stats }) {
    const StatCard = ({ title, value, icon: Icon, color, description }) => (
        <div className="card overflow-hidden">
            <div className="p-5">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <Icon className={`h-6 w-6 ${color}`} />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                        <dl>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                                {title}
                            </dt>
                            <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                {value}
                            </dd>
                            {description && (
                                <dd className="text-xs text-gray-500 dark:text-gray-400">
                                    {description}
                                </dd>
                            )}
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <TodoLayout
            header={
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Admin Dashboard
                </h2>
            }
        >
            <Head title="Admin Dashboard" />

            <div className="space-y-6">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Users"
                        value={stats.total_users}
                        icon={Users}
                        color="text-blue-600"
                        description="Registered users"
                    />
                    <StatCard
                        title="Total Tasks"
                        value={stats.total_tasks}
                        icon={CheckSquare}
                        color="text-green-600"
                        description="All tasks created"
                    />
                    <StatCard
                        title="Categories"
                        value={stats.total_categories}
                        icon={FolderOpen}
                        color="text-purple-600"
                        description="Active categories"
                    />
                    <StatCard
                        title="Completed Tasks"
                        value={stats.completed_tasks}
                        icon={CheckCircle}
                        color="text-emerald-600"
                        description="Successfully completed"
                    />
                </div>

                {/* Task Status Overview */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <StatCard
                        title="Pending Tasks"
                        value={stats.pending_tasks}
                        icon={Clock}
                        color="text-yellow-600"
                        description="Awaiting completion"
                    />
                    <StatCard
                        title="Overdue Tasks"
                        value={stats.overdue_tasks}
                        icon={AlertTriangle}
                        color="text-red-600"
                        description="Past due date"
                    />
                    <StatCard
                        title="Completion Rate"
                        value={
                            stats.total_tasks > 0
                                ? `${Math.round(
                                      (stats.completed_tasks /
                                          stats.total_tasks) *
                                          100
                                  )}%`
                                : "0%"
                        }
                        icon={TrendingUp}
                        color="text-indigo-600"
                        description="Overall progress"
                    />
                </div>

                {/* Quick Actions */}
                <div className="card">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-4">
                            Quick Actions
                        </h3>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <Link
                                href={route("admin.users.create")}
                                className="relative rounded-lg border border-light-border/70 dark:border-white/10 bg-light-card dark:bg-dark-card px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-light-border dark:hover:border-white/20 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                            >
                                <div className="flex-shrink-0">
                                    <Users className="h-6 w-6 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span
                                        className="absolute inset-0"
                                        aria-hidden="true"
                                    />
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        Create User
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                        Add a new user account
                                    </p>
                                </div>
                            </Link>

                            <Link
                                href={route("admin.users.index")}
                                className="relative rounded-lg border border-light-border/70 dark:border-white/10 bg-light-card dark:bg-dark-card px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-light-border dark:hover:border-white/20 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                            >
                                <div className="flex-shrink-0">
                                    <Users className="h-6 w-6 text-green-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span
                                        className="absolute inset-0"
                                        aria-hidden="true"
                                    />
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        Manage Users
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                        View and edit users
                                    </p>
                                </div>
                            </Link>

                            <Link
                                href={route("admin.invite-codes.create")}
                                className="relative rounded-lg border border-light-border/70 dark:border-white/10 bg-light-card dark:bg-dark-card px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-light-border dark:hover:border-white/20 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                            >
                                <div className="flex-shrink-0">
                                    <Users className="h-6 w-6 text-indigo-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span
                                        className="absolute inset-0"
                                        aria-hidden="true"
                                    />
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        Generate Invite Code
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                        Create registration codes
                                    </p>
                                </div>
                            </Link>

                            <Link
                                href={route("categories.index")}
                                className="relative rounded-lg border border-light-border/70 dark:border-white/10 bg-light-card dark:bg-dark-card px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-light-border dark:hover:border-white/20 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                            >
                                <div className="flex-shrink-0">
                                    <FolderOpen className="h-6 w-6 text-purple-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span
                                        className="absolute inset-0"
                                        aria-hidden="true"
                                    />
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        Categories
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                        Manage categories
                                    </p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </TodoLayout>
    );
}

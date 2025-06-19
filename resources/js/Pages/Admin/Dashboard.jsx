import TodoLayout from "@/Layouts/TodoLayout";
import { Head, Link } from "@inertiajs/react";
import {
    Users,
    CheckSquare,
    FolderOpen,
    Activity,
    TrendingUp,
    Clock,
    AlertTriangle,
    CheckCircle,
} from "lucide-react";

export default function Dashboard({ stats, recent_activities }) {
    const StatCard = ({ title, value, icon: Icon, color, description }) => (
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
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

    const getActivityIcon = (action) => {
        switch (action) {
            case "create":
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case "update":
                return <Activity className="h-4 w-4 text-blue-500" />;
            case "delete":
                return <AlertTriangle className="h-4 w-4 text-red-500" />;
            default:
                return <Activity className="h-4 w-4 text-gray-500" />;
        }
    };

    const getActivityColor = (action) => {
        switch (action) {
            case "create":
                return "text-green-600 dark:text-green-400";
            case "update":
                return "text-blue-600 dark:text-blue-400";
            case "delete":
                return "text-red-600 dark:text-red-400";
            default:
                return "text-gray-600 dark:text-gray-400";
        }
    };

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

                {/* Recent Activity */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                                Recent Activity
                            </h3>
                            <Link
                                href={route("admin.activity-logs.index")}
                                className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                                View all
                            </Link>
                        </div>
                        {recent_activities && recent_activities.length > 0 ? (
                            <div className="flow-root">
                                <ul className="-mb-8">
                                    {recent_activities.map(
                                        (activity, index) => (
                                            <li key={activity.id}>
                                                <div className="relative pb-8">
                                                    {index !==
                                                        recent_activities.length -
                                                            1 && (
                                                        <span
                                                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700"
                                                            aria-hidden="true"
                                                        />
                                                    )}
                                                    <div className="relative flex space-x-3">
                                                        <div>
                                                            <span className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center ring-8 ring-white dark:ring-gray-800">
                                                                {getActivityIcon(
                                                                    activity.action
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                                            <div>
                                                                <p className="text-sm text-gray-900 dark:text-gray-100">
                                                                    <span className="font-medium">
                                                                        {activity.user
                                                                            ? activity
                                                                                  .user
                                                                                  .name
                                                                            : "System"}
                                                                    </span>{" "}
                                                                    <span
                                                                        className={getActivityColor(
                                                                            activity.action
                                                                        )}
                                                                    >
                                                                        {
                                                                            activity.action
                                                                        }
                                                                        d
                                                                    </span>{" "}
                                                                    {activity.model_type.toLowerCase()}{" "}
                                                                    <span className="font-medium">
                                                                        {activity.description?.split(
                                                                            ": "
                                                                        )[1] ||
                                                                            `#${activity.model_id}`}
                                                                    </span>
                                                                </p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                    {
                                                                        activity.description
                                                                    }
                                                                </p>
                                                            </div>
                                                            <div className="text-right text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                                                                <time
                                                                    dateTime={
                                                                        activity.created_at
                                                                    }
                                                                >
                                                                    {new Date(
                                                                        activity.created_at
                                                                    ).toLocaleDateString()}
                                                                </time>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        )
                                    )}
                                </ul>
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <Activity className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                                    No recent activity
                                </h3>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    User activities will appear here as they
                                    happen.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-4">
                            Quick Actions
                        </h3>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <Link
                                href={route("admin.users.create")}
                                className="relative rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 dark:hover:border-gray-500 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
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
                                className="relative rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 dark:hover:border-gray-500 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
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
                                href={route("categories.index")}
                                className="relative rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 dark:hover:border-gray-500 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
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

                            <Link
                                href={route("admin.activity-logs.index")}
                                className="relative rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 dark:hover:border-gray-500 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                            >
                                <div className="flex-shrink-0">
                                    <Activity className="h-6 w-6 text-orange-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span
                                        className="absolute inset-0"
                                        aria-hidden="true"
                                    />
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        Activity Logs
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                        View system logs
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

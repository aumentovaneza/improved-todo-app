import TodoLayout from "@/Layouts/TodoLayout";
import { Head, Link, router } from "@inertiajs/react";
import {
    BarChart3,
    TrendingUp,
    Clock,
    Target,
    CheckCircle,
    AlertTriangle,
    Calendar,
    Activity,
    Filter,
    Download,
} from "lucide-react";
import { useState } from "react";

export default function Index({
    stats,
    completionData,
    tasksByCategory,
    tasksByStatus,
    weeklyProductivity,
    recentActivity,
    avgCompletionTime,
    tasksThisWeek,
    period,
}) {
    const [selectedPeriod, setSelectedPeriod] = useState(period);

    const handlePeriodChange = (newPeriod) => {
        setSelectedPeriod(newPeriod);
        router.get(
            route("analytics.index"),
            { period: newPeriod },
            { preserveState: true }
        );
    };

    const completionRate =
        stats.total_tasks > 0
            ? Math.round((stats.completed_tasks / stats.total_tasks) * 100)
            : 0;

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
    };

    const getActivityIcon = (action) => {
        switch (action) {
            case "created":
                return <Target className="w-4 h-4 text-blue-500" />;
            case "completed":
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case "updated":
                return <Activity className="w-4 h-4 text-yellow-500" />;
            default:
                return <Activity className="w-4 h-4 text-gray-500" />;
        }
    };

    // Generate chart data for weekly productivity
    const weeklyChartData = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
    ].map((day) => ({
        day,
        count: weeklyProductivity[day] || 0,
    }));

    const maxWeeklyCount = Math.max(...weeklyChartData.map((d) => d.count), 1);

    return (
        <TodoLayout header="Analytics">
            <Head title="Analytics" />

            <div className="space-y-6">
                {/* Header with Period Selector */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                            Productivity Analytics
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
                            Track your task completion and productivity trends
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:space-x-4 sm:gap-0">
                        <select
                            value={selectedPeriod}
                            onChange={(e) => handlePeriodChange(e.target.value)}
                            className="px-3 sm:px-4 py-2 border border-light-border/70 dark:border-white/10 rounded-md bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100 text-sm min-w-[140px]"
                        >
                            <option value="7">Last 7 days</option>
                            <option value="30">Last 30 days</option>
                            <option value="90">Last 90 days</option>
                        </select>
                        <button className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center text-sm">
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </button>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <div className="card p-4 sm:p-6">
                        <div className="flex items-center">
                            <div className="w-10 sm:w-12 h-10 sm:h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                                <BarChart3 className="w-5 sm:w-6 h-5 sm:h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="ml-4">
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Total Tasks
                                </h3>
                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                    {stats.total_tasks}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="card p-4 sm:p-6">
                        <div className="flex items-center">
                            <div className="w-10 sm:w-12 h-10 sm:h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                                <CheckCircle className="w-5 sm:w-6 h-5 sm:h-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="ml-4">
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Completed
                                </h3>
                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                    {stats.completed_tasks}
                                </p>
                                <p className="text-sm text-green-600 dark:text-green-400">
                                    {completionRate}% completion rate
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="card p-4 sm:p-6">
                        <div className="flex items-center">
                            <div className="w-10 sm:w-12 h-10 sm:h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                                <Clock className="w-5 sm:w-6 h-5 sm:h-6 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <div className="ml-4">
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Pending
                                </h3>
                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                    {stats.pending_tasks}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="card p-4 sm:p-6">
                        <div className="flex items-center">
                            <div className="w-10 sm:w-12 h-10 sm:h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                                <AlertTriangle className="w-5 sm:w-6 h-5 sm:h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <div className="ml-4">
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Overdue
                                </h3>
                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                    {stats.overdue_tasks}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Weekly Productivity Chart */}
                    <div className="card p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                            Weekly Productivity
                        </h3>
                        <div className="space-y-4">
                            {weeklyChartData.map((item) => (
                                <div
                                    key={item.day}
                                    className="flex items-center"
                                >
                                    <div className="w-16 text-sm text-gray-600 dark:text-gray-400">
                                        {item.day.slice(0, 3)}
                                    </div>
                                    <div className="flex-1 mx-4">
                                        <div className="bg-gray-200 dark:bg-dark-card/70 rounded-full h-3">
                                            <div
                                                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                                                style={{
                                                    width: `${
                                                        (item.count /
                                                            maxWeeklyCount) *
                                                        100
                                                    }%`,
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div className="w-8 text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {item.count}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tasks by Category */}
                    <div className="card p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                            Tasks by Category
                        </h3>
                        <div className="space-y-4">
                            {tasksByCategory.map((category, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between"
                                >
                                    <div className="flex items-center">
                                        <div
                                            className="w-4 h-4 rounded-full mr-3"
                                            style={{
                                                backgroundColor: category.color,
                                            }}
                                        ></div>
                                        <span className="text-sm text-gray-900 dark:text-gray-100">
                                            {category.name}
                                        </span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        {category.count}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Performance Metrics */}
                    <div className="card p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                            Performance Metrics
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    Completion Rate
                                </span>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {completionRate}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-dark-card/70 rounded-full h-2">
                                <div
                                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${completionRate}%` }}
                                ></div>
                            </div>

                            <div className="flex justify-between items-center pt-2">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    Avg. Completion Time
                                </span>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {avgCompletionTime} days
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    Tasks This Week
                                </span>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {tasksThisWeek.length}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="lg:col-span-2 card p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                            Recent Activity
                        </h3>
                        <div className="space-y-4 max-h-80 overflow-y-auto">
                            {recentActivity.length > 0 ? (
                                recentActivity.map((activity, index) => (
                                    <div
                                        key={index}
                                        className="flex items-start space-x-3"
                                    >
                                        <div className="flex-shrink-0 mt-1">
                                            {getActivityIcon(activity.action)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-900 dark:text-gray-100">
                                                <span className="font-medium">
                                                    {activity.action}
                                                </span>{" "}
                                                task
                                                {activity.task && (
                                                    <span className="mx-1 font-medium">
                                                        "{activity.task.title}"
                                                    </span>
                                                )}
                                                {activity.task?.category && (
                                                    <span
                                                        className="ml-2 inline-block text-xs px-2 py-1 rounded-full text-white"
                                                        style={{
                                                            backgroundColor:
                                                                activity.task
                                                                    .category
                                                                    .color,
                                                        }}
                                                    >
                                                        {
                                                            activity.task
                                                                .category.name
                                                        }
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                {formatDate(
                                                    activity.created_at
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    No recent activity to display.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="card p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Quick Actions
                    </h3>
                    <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
                        <Link
                            href={route("tasks.index")}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            View All Tasks
                        </Link>
                        <Link
                            href={route("calendar.index")}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                            View Calendar
                        </Link>
                        <Link
                            href={route("categories.index")}
                            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                        >
                            Manage Categories
                        </Link>
                    </div>
                </div>
            </div>
        </TodoLayout>
    );
}

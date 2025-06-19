import TodoLayout from "@/Layouts/TodoLayout";
import { Head, Link, router } from "@inertiajs/react";
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Clock,
    AlertTriangle,
    CheckCircle,
    Plus,
    Eye,
} from "lucide-react";
import { useState, useEffect } from "react";

export default function Index({
    tasks,
    upcomingTasks,
    overdueTasks,
    currentDate,
    monthName,
}) {
    const [selectedDate, setSelectedDate] = useState(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 640);
        };

        checkMobile();
        window.addEventListener("resize", checkMobile);

        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Generate calendar days
    const generateCalendarDays = () => {
        const date = new Date(currentDate);
        const year = date.getFullYear();
        const month = date.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const days = [];
        const current = new Date(startDate);

        for (let i = 0; i < 42; i++) {
            const dateStr = current.toISOString().split("T")[0];
            const isCurrentMonth = current.getMonth() === month;
            const isToday = dateStr === new Date().toISOString().split("T")[0];
            const dayTasks = tasks[dateStr] || [];

            days.push({
                date: new Date(current),
                dateStr,
                day: current.getDate(),
                isCurrentMonth,
                isToday,
                tasks: dayTasks,
            });

            current.setDate(current.getDate() + 1);
        }

        return days;
    };

    const calendarDays = generateCalendarDays();

    const navigateMonth = (direction) => {
        const date = new Date(currentDate);
        date.setMonth(date.getMonth() + direction);
        router.get(
            route("calendar.index"),
            {
                date: date.toISOString().split("T")[0],
            },
            { preserveState: true }
        );
    };

    const getTaskStatusColor = (status) => {
        switch (status) {
            case "completed":
                return "bg-green-500";
            case "pending":
                return "bg-blue-500";
            default:
                return "bg-gray-500";
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
        });
    };

    return (
        <TodoLayout header="Calendar">
            <Head title="Calendar" />

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Main Calendar */}
                <div className="flex-1 order-2 lg:order-1">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                        {/* Calendar Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 gap-4">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {monthName}
                            </h2>
                            <div className="flex items-center justify-center sm:justify-end space-x-2">
                                <button
                                    onClick={() => navigateMonth(-1)}
                                    className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => navigateMonth(1)}
                                    className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() =>
                                        router.get(route("calendar.index"))
                                    }
                                    className="ml-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                                >
                                    Today
                                </button>
                            </div>
                        </div>

                        {/* Calendar Grid */}
                        <div className="p-3 sm:p-6">
                            {/* Day Headers */}
                            <div className="grid grid-cols-7 gap-px mb-4">
                                {[
                                    "Sun",
                                    "Mon",
                                    "Tue",
                                    "Wed",
                                    "Thu",
                                    "Fri",
                                    "Sat",
                                ].map((day) => (
                                    <div
                                        key={day}
                                        className="py-2 text-center text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400"
                                    >
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Days */}
                            <div className="grid grid-cols-7 gap-px">
                                {calendarDays.map((day, index) => (
                                    <div
                                        key={index}
                                        className={`min-h-[80px] sm:min-h-[120px] p-1 sm:p-2 border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                                            !day.isCurrentMonth
                                                ? "bg-gray-50 dark:bg-gray-900/50"
                                                : "bg-white dark:bg-gray-800"
                                        } ${
                                            day.isToday
                                                ? "ring-2 ring-blue-500 dark:ring-blue-400"
                                                : ""
                                        }`}
                                        onClick={() =>
                                            setSelectedDate(day.dateStr)
                                        }
                                    >
                                        <div
                                            className={`text-xs sm:text-sm font-medium mb-1 sm:mb-2 ${
                                                !day.isCurrentMonth
                                                    ? "text-gray-400 dark:text-gray-500"
                                                    : day.isToday
                                                    ? "text-blue-600 dark:text-blue-400"
                                                    : "text-gray-900 dark:text-gray-100"
                                            }`}
                                        >
                                            {day.day}
                                        </div>

                                        {/* Tasks for this day */}
                                        <div className="space-y-1">
                                            {day.tasks
                                                .slice(0, isMobile ? 2 : 3)
                                                .map((task) => (
                                                    <div
                                                        key={task.id}
                                                        className={`text-xs p-1 rounded text-white truncate ${getTaskStatusColor(
                                                            task.status
                                                        )}`}
                                                        title={task.title}
                                                    >
                                                        {task.title}
                                                    </div>
                                                ))}
                                            {day.tasks.length >
                                                (isMobile ? 2 : 3) && (
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    +
                                                    {day.tasks.length -
                                                        (isMobile ? 2 : 3)}{" "}
                                                    more
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="w-full lg:w-80 space-y-6 order-1 lg:order-2">
                    {/* Quick Actions */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                            Quick Actions
                        </h3>
                        <div className="space-y-3">
                            <Link
                                href={route("tasks.index")}
                                className="flex items-center w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Create New Task
                            </Link>
                            <Link
                                href={route("tasks.index")}
                                className="flex items-center w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <Eye className="w-4 h-4 mr-2" />
                                View All Tasks
                            </Link>
                        </div>
                    </div>

                    {/* Overdue Tasks */}
                    {overdueTasks.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
                            <div className="flex items-center mb-4">
                                <AlertTriangle className="w-4 sm:w-5 h-4 sm:h-5 text-red-500 mr-2" />
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    Overdue Tasks ({overdueTasks.length})
                                </h3>
                            </div>
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                {overdueTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                                    >
                                        <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                            {task.title}
                                        </h4>
                                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                            Due: {formatDate(task.due_date)}
                                        </p>
                                        {task.category && (
                                            <span
                                                className="inline-block text-xs px-2 py-1 rounded-full text-white mt-2"
                                                style={{
                                                    backgroundColor:
                                                        task.category.color,
                                                }}
                                            >
                                                {task.category.name}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Upcoming Tasks */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
                        <div className="flex items-center mb-4">
                            <Clock className="w-4 sm:w-5 h-4 sm:h-5 text-blue-500 mr-2" />
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                                Upcoming Tasks ({upcomingTasks.length})
                            </h3>
                        </div>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                            {upcomingTasks.length > 0 ? (
                                upcomingTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                                    >
                                        <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                            {task.title}
                                        </h4>
                                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                            Due: {formatDate(task.due_date)}
                                        </p>
                                        {task.category && (
                                            <span
                                                className="inline-block text-xs px-2 py-1 rounded-full text-white mt-2"
                                                style={{
                                                    backgroundColor:
                                                        task.category.color,
                                                }}
                                            >
                                                {task.category.name}
                                            </span>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    No upcoming tasks in the next 7 days.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </TodoLayout>
    );
}

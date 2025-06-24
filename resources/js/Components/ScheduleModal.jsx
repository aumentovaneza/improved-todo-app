import { useState, useEffect } from "react";
import { Link, router } from "@inertiajs/react";
import { toast } from "react-toastify";
import {
    Calendar,
    X,
    Eye,
    Edit,
    CheckCircle,
    Clock,
    AlertTriangle,
    Circle,
} from "lucide-react";

export default function ScheduleModal({
    show,
    onClose,
    currentTasks = [],
    todayTasks = [],
    overdueTasks = [],
    upcomingTasks = [],
    weeklyTasks = [],
    toggleTaskStatus,
    setSelectedTask,
    setShowViewModal,
    setShowEditModal,
}) {
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        return (
            today.getFullYear() +
            "-" +
            String(today.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(today.getDate()).padStart(2, "0")
        );
    });
    const [selectedDateTasks, setSelectedDateTasks] = useState([]);

    // Get tasks for a specific date from weeklyTasks
    const getTasksForDate = (date) => {
        // Filter weekly tasks for the specific date
        const tasksForDate = weeklyTasks.filter((task) => {
            if (!task.due_date) return false;
            // Use local date components to avoid timezone issues
            const taskDate = new Date(task.due_date);
            const taskDateStr =
                taskDate.getFullYear() +
                "-" +
                String(taskDate.getMonth() + 1).padStart(2, "0") +
                "-" +
                String(taskDate.getDate()).padStart(2, "0");
            return taskDateStr === date;
        });

        // Sort tasks by time - all-day tasks first, then by time
        return tasksForDate.sort((a, b) => {
            // All-day tasks come first
            if (a.is_all_day && !b.is_all_day) return -1;
            if (!a.is_all_day && b.is_all_day) return 1;

            // If both are all-day, sort by priority
            if (a.is_all_day && b.is_all_day) {
                const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            }

            // If both have times, sort by start time (or end time if no start time)
            const aTime = a.start_time || a.end_time;
            const bTime = b.start_time || b.end_time;
            if (aTime && bTime) {
                return aTime.localeCompare(bTime);
            }

            return 0;
        });
    };

    // Update tasks when selected date changes
    useEffect(() => {
        if (selectedDate && show) {
            setSelectedDateTasks(getTasksForDate(selectedDate));
        }
    }, [selectedDate, show, weeklyTasks]);

    if (!show) return null;

    const getPriorityColor = (priority) => {
        switch (priority) {
            case "urgent":
                return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20";
            case "high":
                return "text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/20";
            case "medium":
                return "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20";
            case "low":
                return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20";
            default:
                return "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "completed":
                return <CheckCircle className="h-5 w-5 text-gray-500" />;
            case "in_progress":
                return <Clock className="h-5 w-5 text-green-500" />;
            case "cancelled":
                return <AlertTriangle className="h-5 w-5 text-red-500" />;
            default:
                return <Circle className="h-5 w-5 text-gray-400" />;
        }
    };

    const formatTaskTime = (task) => {
        if (task.is_all_day || (!task.start_time && !task.end_time)) {
            return "All day";
        }

        const formatTime = (timeStr) => {
            if (!timeStr) return "";
            // Handle both time formats (HH:MM and full datetime)
            if (timeStr.includes("T") || timeStr.includes(" ")) {
                const date = new Date(timeStr);
                return date.toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                });
            }
            // Just time string like "14:30:00" or "14:30"
            const [hours, minutes] = timeStr.split(":");
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? "PM" : "AM";
            const displayHour = hour % 12 || 12;
            return `${displayHour}:${minutes} ${ampm}`;
        };

        const startTime = task.start_time ? formatTime(task.start_time) : "";
        const endTime = task.end_time ? formatTime(task.end_time) : "";

        if (startTime && endTime) {
            return `${startTime} - ${endTime}`;
        } else if (startTime) {
            return `From ${startTime}`;
        } else if (endTime) {
            return `Until ${endTime}`;
        }

        return "All day";
    };

    const getNext7Days = () => {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            // Use local date components to avoid timezone issues
            const dateStr =
                date.getFullYear() +
                "-" +
                String(date.getMonth() + 1).padStart(2, "0") +
                "-" +
                String(date.getDate()).padStart(2, "0");
            days.push({
                date: dateStr,
                dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
                dayNumber: date.getDate(),
                isToday: i === 0,
                tasks: getTasksForDate(dateStr),
            });
        }
        return days;
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
                <div
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 transition-opacity"
                    onClick={onClose}
                />
                <div className="relative bg-white dark:bg-dark-secondary rounded-lg shadow-xl max-w-4xl w-full flex flex-col max-h-[90vh]">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between p-6 border-b border-light-border dark:border-dark-border flex-shrink-0">
                        <h2 className="text-xl font-semibold text-adaptive-primary flex items-center">
                            <Calendar className="h-6 w-6 text-primary-500 mr-2" />
                            Schedule Overview
                        </h2>
                        <button
                            onClick={onClose}
                            className="rounded-md p-2 text-light-muted hover:text-light-primary dark:text-dark-muted dark:hover:text-dark-primary hover:bg-light-hover dark:hover:bg-dark-hover transition-colors duration-200"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Modal Content - Scrollable */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {/* Quick Date Navigation */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-adaptive-secondary mb-2">
                                Jump to Date
                            </label>
                            <div className="flex flex-wrap items-center gap-3">
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) =>
                                        setSelectedDate(e.target.value)
                                    }
                                    className="input-primary w-48"
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            const today = new Date();
                                            const todayStr =
                                                today.getFullYear() +
                                                "-" +
                                                String(
                                                    today.getMonth() + 1
                                                ).padStart(2, "0") +
                                                "-" +
                                                String(
                                                    today.getDate()
                                                ).padStart(2, "0");
                                            setSelectedDate(todayStr);
                                        }}
                                        className="btn-secondary text-xs py-1 px-2"
                                    >
                                        Today
                                    </button>
                                    <button
                                        onClick={() => {
                                            const tomorrow = new Date();
                                            tomorrow.setDate(
                                                tomorrow.getDate() + 1
                                            );
                                            const tomorrowStr =
                                                tomorrow.getFullYear() +
                                                "-" +
                                                String(
                                                    tomorrow.getMonth() + 1
                                                ).padStart(2, "0") +
                                                "-" +
                                                String(
                                                    tomorrow.getDate()
                                                ).padStart(2, "0");
                                            setSelectedDate(tomorrowStr);
                                        }}
                                        className="btn-secondary text-xs py-1 px-2"
                                    >
                                        Tomorrow
                                    </button>
                                    <button
                                        onClick={() => {
                                            const nextWeek = new Date();
                                            nextWeek.setDate(
                                                nextWeek.getDate() + 7
                                            );
                                            setSelectedDate(
                                                nextWeek
                                                    .toISOString()
                                                    .split("T")[0]
                                            );
                                        }}
                                        className="btn-secondary text-xs py-1 px-2"
                                    >
                                        Next Week
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Next 7 Days View */}
                        <div className="mb-8">
                            <h3 className="text-lg font-medium text-adaptive-primary mb-4">
                                Next 7 Days
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {getNext7Days().map((day) => (
                                    <div
                                        key={day.date}
                                        className={`card p-4 ${
                                            day.isToday
                                                ? "ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20"
                                                : ""
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <h4 className="font-medium text-adaptive-primary">
                                                    {day.dayName}
                                                </h4>
                                                <p className="text-sm text-adaptive-muted">
                                                    {day.dayNumber}
                                                </p>
                                            </div>
                                            <span
                                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                    day.tasks.length === 0
                                                        ? "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                                                        : day.tasks.length <= 2
                                                        ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                                        : day.tasks.length <= 4
                                                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                                                        : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                                                }`}
                                            >
                                                {day.tasks.length} tasks
                                            </span>
                                        </div>

                                        <div className="space-y-2">
                                            {day.tasks.length === 0 ? (
                                                <p className="text-xs text-adaptive-muted italic">
                                                    No tasks scheduled
                                                </p>
                                            ) : (
                                                day.tasks
                                                    .slice(0, 3)
                                                    .map((task) => (
                                                        <div
                                                            key={task.id}
                                                            className="flex items-center justify-between p-2 bg-light-hover dark:bg-dark-hover rounded-md"
                                                        >
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-medium text-adaptive-primary truncate">
                                                                    {task.title}
                                                                </p>
                                                                <div className="flex items-center space-x-1 mt-1">
                                                                    <span
                                                                        className={`inline-flex items-center px-1 py-0.5 rounded text-xs font-medium ${getPriorityColor(
                                                                            task.priority
                                                                        )}`}
                                                                    >
                                                                        {
                                                                            task.priority
                                                                        }
                                                                    </span>
                                                                    <span className="text-xs text-adaptive-muted">
                                                                        {formatTaskTime(
                                                                            task
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedTask(
                                                                        task
                                                                    );
                                                                    setShowViewModal(
                                                                        true
                                                                    );
                                                                }}
                                                                className="ml-2 p-1 text-light-muted hover:text-primary-500 dark:text-dark-muted dark:hover:text-primary-400"
                                                            >
                                                                <Eye className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    ))
                                            )}
                                            {day.tasks.length > 3 && (
                                                <p className="text-xs text-adaptive-muted text-center">
                                                    +{day.tasks.length - 3} more
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Selected Date Tasks */}
                        {selectedDate && (
                            <div>
                                <h3 className="text-lg font-medium text-adaptive-primary mb-4">
                                    Tasks for{" "}
                                    {new Date(
                                        selectedDate + "T00:00:00"
                                    ).toLocaleDateString("en-US", {
                                        weekday: "long",
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </h3>
                                <div className="space-y-3">
                                    {selectedDateTasks.length === 0 ? (
                                        <div className="text-center py-8 card">
                                            <Calendar className="mx-auto h-12 w-12 text-light-muted dark:text-dark-muted" />
                                            <h4 className="mt-2 text-sm font-medium text-adaptive-primary">
                                                No tasks scheduled
                                            </h4>
                                            <p className="mt-1 text-sm text-adaptive-muted">
                                                This date is free!
                                            </p>
                                        </div>
                                    ) : (
                                        selectedDateTasks.map((task) => (
                                            <div
                                                key={task.id}
                                                className="card p-4"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3 flex-1">
                                                        <button
                                                            onClick={() =>
                                                                toggleTaskStatus(
                                                                    task
                                                                )
                                                            }
                                                            className="flex-shrink-0"
                                                        >
                                                            {getStatusIcon(
                                                                task.status
                                                            )}
                                                        </button>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <h4 className="text-sm font-medium text-adaptive-primary">
                                                                    {task.title}
                                                                </h4>
                                                                <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                                                                    {formatTaskTime(
                                                                        task
                                                                    )}
                                                                </span>
                                                            </div>
                                                            {task.description && (
                                                                <p className="text-xs text-adaptive-muted mt-1">
                                                                    {
                                                                        task.description
                                                                    }
                                                                </p>
                                                            )}
                                                            <div className="flex items-center space-x-2 mt-2">
                                                                <span
                                                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                                                                        task.priority
                                                                    )}`}
                                                                >
                                                                    {task.priority
                                                                        .charAt(
                                                                            0
                                                                        )
                                                                        .toUpperCase() +
                                                                        task.priority.slice(
                                                                            1
                                                                        )}
                                                                </span>
                                                                {task.category && (
                                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary-100 text-secondary-700 dark:bg-secondary-900/20 dark:text-secondary-300">
                                                                        {
                                                                            task
                                                                                .category
                                                                                .name
                                                                        }
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedTask(
                                                                    task
                                                                );
                                                                setShowViewModal(
                                                                    true
                                                                );
                                                            }}
                                                            className="btn-secondary p-2"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedTask(
                                                                    task
                                                                );
                                                                setShowEditModal(
                                                                    true
                                                                );
                                                            }}
                                                            className="btn-accent p-2"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Modal Footer - Fixed at bottom */}
                    <div className="flex items-center justify-between p-6 border-t border-light-border dark:border-dark-border bg-light-hover dark:bg-dark-hover flex-shrink-0">
                        <p className="text-sm text-adaptive-muted">
                            Click on tasks to view details or reschedule
                        </p>
                        <div className="flex space-x-3">
                            <button onClick={onClose} className="btn-secondary">
                                Close
                            </button>
                            <Link
                                href={route("calendar.index")}
                                className="btn-primary"
                                onClick={onClose}
                            >
                                <Calendar className="mr-2 h-4 w-4" />
                                Full Calendar
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

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
    List,
    Grid3X3,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { useState, useEffect } from "react";
import DayTasksModal from "@/Components/DayTasksModal";
import TaskViewModal from "@/Components/TaskViewModal";
import TaskEditModal from "@/Components/TaskEditModal";
import { toast } from "react-toastify";

export default function Index({
    tasks,
    upcomingTasks,
    overdueTasks,
    currentDate,
    monthName,
    categories,
}) {
    const [selectedDate, setSelectedDate] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    const [mobileViewType, setMobileViewType] = useState("list"); // 'list' or 'calendar'
    const [showDayTasksModal, setShowDayTasksModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [expandedDates, setExpandedDates] = useState(new Set());

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768); // Changed to 768px for better mobile detection
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
            // Use local date string to avoid timezone conversion issues
            const dateStr =
                current.getFullYear() +
                "-" +
                String(current.getMonth() + 1).padStart(2, "0") +
                "-" +
                String(current.getDate()).padStart(2, "0");
            const isCurrentMonth = current.getMonth() === month;
            const today = new Date();
            const todayStr =
                today.getFullYear() +
                "-" +
                String(today.getMonth() + 1).padStart(2, "0") +
                "-" +
                String(today.getDate()).padStart(2, "0");
            const isToday = dateStr === todayStr;
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
        const dateStr =
            date.getFullYear() +
            "-" +
            String(date.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(date.getDate()).padStart(2, "0");
        router.get(
            route("calendar.index"),
            {
                date: dateStr,
            },
            { preserveState: true }
        );
    };

    const getTaskStatusColor = (status) => {
        switch (status) {
            case "completed":
                return "bg-gray-500";
            case "in_progress":
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

    const handleDayClick = (day) => {
        setSelectedDate(day.dateStr);
        setShowDayTasksModal(true);
    };

    const handleTaskView = (task) => {
        setSelectedTask(task);
        setShowViewModal(true);
    };

    const handleTaskEdit = (task) => {
        setSelectedTask(task);
        setShowEditModal(true);
    };

    const handleTaskStatusToggle = async (task) => {
        const newStatus = task.status === "completed" ? "pending" : "completed";

        try {
            await router.patch(
                route("tasks.update", task.id),
                {
                    status: newStatus,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success(
                            `Task ${
                                newStatus === "completed"
                                    ? "completed"
                                    : "reopened"
                            } successfully!`
                        );
                    },
                    onError: () => {
                        toast.error("Failed to update task status");
                    },
                }
            );
        } catch (error) {
            toast.error("Failed to update task status");
        }
    };

    const handleTaskUpdate = () => {
        // Refresh the page data after task update
        router.reload({ preserveState: true, preserveScroll: true });
    };

    const getSelectedDateTasks = () => {
        if (!selectedDate) return [];
        return tasks[selectedDate] || [];
    };

    // Generate mobile-friendly task list grouped by date
    const generateMobileTaskList = () => {
        const date = new Date(currentDate);
        const year = date.getFullYear();
        const month = date.getMonth();

        // Get all days in the current month
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const tasksByDate = [];

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(
                2,
                "0"
            )}-${String(day).padStart(2, "0")}`;
            const dayTasks = tasks[dateStr] || [];

            if (dayTasks.length > 0) {
                const dateObj = new Date(year, month, day);
                const today = new Date();
                const isToday = dateStr === today.toISOString().split("T")[0];

                tasksByDate.push({
                    dateStr,
                    date: dateObj,
                    day,
                    isToday,
                    tasks: dayTasks,
                    dayName: dateObj.toLocaleDateString("en-US", {
                        weekday: "long",
                    }),
                    formattedDate: dateObj.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                    }),
                });
            }
        }

        return tasksByDate;
    };

    const mobileTaskList = generateMobileTaskList();

    const toggleDateExpansion = (dateStr) => {
        const newExpanded = new Set(expandedDates);
        if (newExpanded.has(dateStr)) {
            newExpanded.delete(dateStr);
        } else {
            newExpanded.add(dateStr);
        }
        setExpandedDates(newExpanded);
    };

    const renderMobileListView = () => {
        if (mobileTaskList.length === 0) {
            return (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
                    <CalendarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        No tasks this month
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                        You don't have any tasks scheduled for {monthName}.
                    </p>
                    <Link
                        href={route("tasks.index")}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Create New Task
                    </Link>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {mobileTaskList.map((dateGroup) => {
                    const isExpanded = expandedDates.has(dateGroup.dateStr);
                    const visibleTasks = isExpanded
                        ? dateGroup.tasks
                        : dateGroup.tasks.slice(0, 2);

                    return (
                        <div
                            key={dateGroup.dateStr}
                            className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden ${
                                dateGroup.isToday
                                    ? "ring-2 ring-blue-500 dark:ring-blue-400"
                                    : ""
                            }`}
                        >
                            {/* Date Header */}
                            <div
                                className={`p-4 border-b border-gray-200 dark:border-gray-700 ${
                                    dateGroup.isToday
                                        ? "bg-blue-50 dark:bg-blue-900/20"
                                        : "bg-gray-50 dark:bg-gray-900/50"
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div
                                            className={`text-2xl font-bold ${
                                                dateGroup.isToday
                                                    ? "text-blue-600 dark:text-blue-400"
                                                    : "text-gray-900 dark:text-gray-100"
                                            }`}
                                        >
                                            {dateGroup.day}
                                        </div>
                                        <div>
                                            <div
                                                className={`font-medium ${
                                                    dateGroup.isToday
                                                        ? "text-blue-600 dark:text-blue-400"
                                                        : "text-gray-900 dark:text-gray-100"
                                                }`}
                                            >
                                                {dateGroup.dayName}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {dateGroup.formattedDate}
                                            </div>
                                        </div>
                                        {dateGroup.isToday && (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                Today
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            {dateGroup.tasks.length} task
                                            {dateGroup.tasks.length !== 1
                                                ? "s"
                                                : ""}
                                        </span>
                                        {dateGroup.tasks.length > 2 && (
                                            <button
                                                onClick={() =>
                                                    toggleDateExpansion(
                                                        dateGroup.dateStr
                                                    )
                                                }
                                                className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                {isExpanded ? (
                                                    <ChevronUp className="w-4 h-4 text-gray-500" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Tasks List */}
                            <div className="p-4 space-y-3">
                                {visibleTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                                    >
                                        {/* Status Checkbox */}
                                        <button
                                            onClick={() =>
                                                handleTaskStatusToggle(task)
                                            }
                                            className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                                task.status === "completed"
                                                    ? "bg-green-500 border-green-500 text-white"
                                                    : "border-gray-300 dark:border-gray-600 hover:border-green-500"
                                            }`}
                                        >
                                            {task.status === "completed" && (
                                                <CheckCircle className="w-3 h-3" />
                                            )}
                                        </button>

                                        {/* Task Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <h4
                                                        className={`font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
                                                            task.status ===
                                                            "completed"
                                                                ? "line-through opacity-60"
                                                                : ""
                                                        }`}
                                                        onClick={() =>
                                                            handleTaskView(task)
                                                        }
                                                    >
                                                        {task.title}
                                                    </h4>

                                                    {/* Time */}
                                                    {!task.is_all_day &&
                                                        (task.start_time ||
                                                            task.end_time) && (
                                                            <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                                <Clock className="w-3 h-3 mr-1" />
                                                                {(() => {
                                                                    const formatTime =
                                                                        (
                                                                            timeStr
                                                                        ) => {
                                                                            if (
                                                                                !timeStr
                                                                            )
                                                                                return "";
                                                                            if (
                                                                                timeStr.includes(
                                                                                    "T"
                                                                                ) ||
                                                                                timeStr.includes(
                                                                                    " "
                                                                                )
                                                                            ) {
                                                                                const date =
                                                                                    new Date(
                                                                                        timeStr
                                                                                    );
                                                                                return date.toLocaleTimeString(
                                                                                    [],
                                                                                    {
                                                                                        hour: "numeric",
                                                                                        minute: "2-digit",
                                                                                        hour12: true,
                                                                                    }
                                                                                );
                                                                            }
                                                                            const [
                                                                                hours,
                                                                                minutes,
                                                                            ] =
                                                                                timeStr.split(
                                                                                    ":"
                                                                                );
                                                                            const hour =
                                                                                parseInt(
                                                                                    hours
                                                                                );
                                                                            const ampm =
                                                                                hour >=
                                                                                12
                                                                                    ? "PM"
                                                                                    : "AM";
                                                                            const displayHour =
                                                                                hour %
                                                                                    12 ||
                                                                                12;
                                                                            return `${displayHour}:${minutes} ${ampm}`;
                                                                        };

                                                                    const startTime =
                                                                        formatTime(
                                                                            task.start_time
                                                                        );
                                                                    const endTime =
                                                                        formatTime(
                                                                            task.end_time
                                                                        );

                                                                    if (
                                                                        startTime &&
                                                                        endTime
                                                                    ) {
                                                                        return `${startTime} - ${endTime}`;
                                                                    } else if (
                                                                        startTime
                                                                    ) {
                                                                        return `From ${startTime}`;
                                                                    } else if (
                                                                        endTime
                                                                    ) {
                                                                        return `Until ${endTime}`;
                                                                    }
                                                                    return "All day";
                                                                })()}
                                                            </div>
                                                        )}

                                                    {/* Category */}
                                                    {task.category && (
                                                        <div className="mt-2">
                                                            <span
                                                                className="inline-block text-xs px-2 py-1 rounded-full text-white"
                                                                style={{
                                                                    backgroundColor:
                                                                        task.status ===
                                                                        "completed"
                                                                            ? "#6B7280"
                                                                            : task
                                                                                  .category
                                                                                  .color,
                                                                }}
                                                            >
                                                                {
                                                                    task
                                                                        .category
                                                                        .name
                                                                }
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Tags */}
                                                    {task.tags &&
                                                        task.tags.length >
                                                            0 && (
                                                            <div className="flex flex-wrap gap-1 mt-2">
                                                                {task.tags
                                                                    .slice(0, 3)
                                                                    .map(
                                                                        (
                                                                            tag
                                                                        ) => (
                                                                            <span
                                                                                key={
                                                                                    tag.id
                                                                                }
                                                                                className="inline-block text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
                                                                            >
                                                                                {
                                                                                    tag.name
                                                                                }
                                                                            </span>
                                                                        )
                                                                    )}
                                                                {task.tags
                                                                    .length >
                                                                    3 && (
                                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                        +
                                                                        {task
                                                                            .tags
                                                                            .length -
                                                                            3}{" "}
                                                                        more
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                </div>

                                                {/* Action Button */}
                                                <button
                                                    onClick={() =>
                                                        handleTaskEdit(task)
                                                    }
                                                    className="flex-shrink-0 ml-2 p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Show More Button */}
                                {!isExpanded && dateGroup.tasks.length > 2 && (
                                    <button
                                        onClick={() =>
                                            toggleDateExpansion(
                                                dateGroup.dateStr
                                            )
                                        }
                                        className="w-full py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                                    >
                                        Show {dateGroup.tasks.length - 2} more
                                        task
                                        {dateGroup.tasks.length - 2 !== 1
                                            ? "s"
                                            : ""}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
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
                            <div className="flex items-center justify-between sm:justify-end space-x-2">
                                {/* Mobile View Toggle */}
                                {isMobile && (
                                    <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mr-2">
                                        <button
                                            onClick={() =>
                                                setMobileViewType("list")
                                            }
                                            className={`p-2 rounded-md transition-colors ${
                                                mobileViewType === "list"
                                                    ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                            }`}
                                        >
                                            <List className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() =>
                                                setMobileViewType("calendar")
                                            }
                                            className={`p-2 rounded-md transition-colors ${
                                                mobileViewType === "calendar"
                                                    ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                            }`}
                                        >
                                            <Grid3X3 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}

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

                        {/* Calendar Content */}
                        <div className="p-3 sm:p-6">
                            {isMobile && mobileViewType === "list" ? (
                                renderMobileListView()
                            ) : (
                                <>
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
                                                    handleDayClick(day)
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
                                                        .slice(
                                                            0,
                                                            isMobile ? 2 : 3
                                                        )
                                                        .map((task) => (
                                                            <div
                                                                key={task.id}
                                                                className={`text-xs p-1 rounded text-white truncate ${getTaskStatusColor(
                                                                    task.status
                                                                )}`}
                                                                title={`${
                                                                    task.title
                                                                } - ${
                                                                    task.is_all_day ||
                                                                    (!task.start_time &&
                                                                        !task.end_time)
                                                                        ? "All day"
                                                                        : (() => {
                                                                              const formatTime =
                                                                                  (
                                                                                      timeStr
                                                                                  ) => {
                                                                                      if (
                                                                                          !timeStr
                                                                                      )
                                                                                          return "";
                                                                                      if (
                                                                                          timeStr.includes(
                                                                                              "T"
                                                                                          ) ||
                                                                                          timeStr.includes(
                                                                                              " "
                                                                                          )
                                                                                      ) {
                                                                                          const date =
                                                                                              new Date(
                                                                                                  timeStr
                                                                                              );
                                                                                          return date.toLocaleTimeString(
                                                                                              [],
                                                                                              {
                                                                                                  hour: "numeric",
                                                                                                  minute: "2-digit",
                                                                                                  hour12: true,
                                                                                              }
                                                                                          );
                                                                                      }
                                                                                      // Just time string like "14:30:00" or "14:30"
                                                                                      const [
                                                                                          hours,
                                                                                          minutes,
                                                                                      ] =
                                                                                          timeStr.split(
                                                                                              ":"
                                                                                          );
                                                                                      const hour =
                                                                                          parseInt(
                                                                                              hours
                                                                                          );
                                                                                      const ampm =
                                                                                          hour >=
                                                                                          12
                                                                                              ? "PM"
                                                                                              : "AM";
                                                                                      const displayHour =
                                                                                          hour %
                                                                                              12 ||
                                                                                          12;
                                                                                      return `${displayHour}:${minutes} ${ampm}`;
                                                                                  };

                                                                              const startTime =
                                                                                  formatTime(
                                                                                      task.start_time
                                                                                  );
                                                                              const endTime =
                                                                                  formatTime(
                                                                                      task.end_time
                                                                                  );

                                                                              if (
                                                                                  startTime &&
                                                                                  endTime
                                                                              ) {
                                                                                  return `${startTime} - ${endTime}`;
                                                                              } else if (
                                                                                  startTime
                                                                              ) {
                                                                                  return `From ${startTime}`;
                                                                              } else if (
                                                                                  endTime
                                                                              ) {
                                                                                  return `Until ${endTime}`;
                                                                              }
                                                                              return "All day";
                                                                          })()
                                                                }`}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <span className="truncate flex-1">
                                                                        {
                                                                            task.title
                                                                        }
                                                                    </span>
                                                                    {!task.is_all_day &&
                                                                        (task.start_time ||
                                                                            task.end_time) && (
                                                                            <span className="ml-1 opacity-75 text-xs">
                                                                                {(() => {
                                                                                    const formatTime =
                                                                                        (
                                                                                            timeStr
                                                                                        ) => {
                                                                                            if (
                                                                                                !timeStr
                                                                                            )
                                                                                                return "";
                                                                                            if (
                                                                                                timeStr.includes(
                                                                                                    "T"
                                                                                                ) ||
                                                                                                timeStr.includes(
                                                                                                    " "
                                                                                                )
                                                                                            ) {
                                                                                                const date =
                                                                                                    new Date(
                                                                                                        timeStr
                                                                                                    );
                                                                                                return date.toLocaleTimeString(
                                                                                                    [],
                                                                                                    {
                                                                                                        hour: "numeric",
                                                                                                        minute: "2-digit",
                                                                                                        hour12: true,
                                                                                                    }
                                                                                                );
                                                                                            }
                                                                                            // Just time string like "14:30:00" or "14:30"
                                                                                            const [
                                                                                                hours,
                                                                                                minutes,
                                                                                            ] =
                                                                                                timeStr.split(
                                                                                                    ":"
                                                                                                );
                                                                                            const hour =
                                                                                                parseInt(
                                                                                                    hours
                                                                                                );
                                                                                            const ampm =
                                                                                                hour >=
                                                                                                12
                                                                                                    ? "PM"
                                                                                                    : "AM";
                                                                                            const displayHour =
                                                                                                hour %
                                                                                                    12 ||
                                                                                                12;
                                                                                            return `${displayHour}:${minutes} ${ampm}`;
                                                                                        };

                                                                                    const startTime =
                                                                                        formatTime(
                                                                                            task.start_time
                                                                                        );
                                                                                    const endTime =
                                                                                        formatTime(
                                                                                            task.end_time
                                                                                        );

                                                                                    if (
                                                                                        startTime &&
                                                                                        endTime
                                                                                    ) {
                                                                                        return `${startTime}-${endTime}`;
                                                                                    } else if (
                                                                                        startTime
                                                                                    ) {
                                                                                        return startTime;
                                                                                    } else if (
                                                                                        endTime
                                                                                    ) {
                                                                                        return endTime;
                                                                                    }
                                                                                    return "";
                                                                                })()}
                                                                            </span>
                                                                        )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    {day.tasks.length >
                                                        (isMobile ? 2 : 3) && (
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            +
                                                            {day.tasks.length -
                                                                (isMobile
                                                                    ? 2
                                                                    : 3)}{" "}
                                                            more
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar - Hidden on mobile when in list view */}
                <div
                    className={`w-full lg:w-80 space-y-6 order-1 lg:order-2 ${
                        isMobile && mobileViewType === "list" ? "hidden" : ""
                    }`}
                >
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
                                                        task.status ===
                                                        "completed"
                                                            ? "#6B7280"
                                                            : task.category
                                                                  .color,
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
                                        <div className="flex items-center space-x-2 mb-1">
                                            <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                                {task.title}
                                            </h4>
                                            {task.is_recurring && (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                                                    Recurring
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                            Due: {formatDate(task.due_date)}
                                        </p>
                                        {task.category && (
                                            <span
                                                className="inline-block text-xs px-2 py-1 rounded-full text-white mt-2"
                                                style={{
                                                    backgroundColor:
                                                        task.status ===
                                                        "completed"
                                                            ? "#6B7280"
                                                            : task.category
                                                                  .color,
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

            {/* Modals */}
            <DayTasksModal
                show={showDayTasksModal}
                onClose={() => {
                    setShowDayTasksModal(false);
                    setSelectedDate(null);
                }}
                selectedDate={selectedDate}
                tasks={getSelectedDateTasks()}
                onTaskView={handleTaskView}
                onTaskEdit={handleTaskEdit}
                onTaskStatusToggle={handleTaskStatusToggle}
            />

            <TaskViewModal
                show={showViewModal}
                onClose={() => {
                    setShowViewModal(false);
                    setSelectedTask(null);
                }}
                task={selectedTask}
                onTaskUpdate={handleTaskUpdate}
            />

            <TaskEditModal
                show={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedTask(null);
                }}
                task={selectedTask}
                categories={categories}
                onTaskUpdate={handleTaskUpdate}
            />
        </TodoLayout>
    );
}

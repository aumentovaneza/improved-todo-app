import TodoLayout from "@/Layouts/TodoLayout";
import { Head, Link, router } from "@inertiajs/react";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
    Plus,
    CheckCircle,
    Clock,
    AlertTriangle,
    Calendar,
    TrendingUp,
    CheckSquare,
    Circle,
    Edit,
    Trash2,
    X,
    CalendarDays,
    Target,
    Zap,
    Eye,
} from "lucide-react";
import TaskModal from "@/Components/TaskModal";
import TaskViewModal from "@/Components/TaskViewModal";
import TaskEditModal from "@/Components/TaskEditModal";
import ScheduleModal from "@/Components/ScheduleModal";
import WeatherWidget from "@/Components/widgets/WeatherWidget";
import NewsWidget from "@/Components/widgets/NewsWidget";

export default function Dashboard({
    currentTasks = [],
    todayTasks = [],
    overdueTasks = [],
    upcomingTasks = [],
    weeklyTasks = [],
    stats = {},
    categories = [],
}) {
    const [localCurrentTasks, setLocalCurrentTasks] = useState(
        currentTasks || []
    );
    const [localTodayTasks, setLocalTodayTasks] = useState(todayTasks || []);
    const [localOverdueTasks, setLocalOverdueTasks] = useState(
        overdueTasks || []
    );
    const [localUpcomingTasks, setLocalUpcomingTasks] = useState(
        upcomingTasks || []
    );
    const [showQuickTask, setShowQuickTask] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);

    // Handle task updates from modals
    const handleTaskUpdate = (updatedTask) => {
        setSelectedTask(updatedTask);
        // Update the task in all relevant lists
        const updateTaskInList = (taskList, setTaskList) => {
            setTaskList(
                taskList.map((t) => (t.id === updatedTask.id ? updatedTask : t))
            );
        };

        updateTaskInList(localCurrentTasks, setLocalCurrentTasks);
        updateTaskInList(localTodayTasks, setLocalTodayTasks);
        updateTaskInList(localOverdueTasks, setLocalOverdueTasks);
        updateTaskInList(localUpcomingTasks, setLocalUpcomingTasks);
    };

    const [quickTask, setQuickTask] = useState({
        title: "",
        description: "",
        category_id: "",
        priority: "medium",
        due_date: "",
        start_time: "",
        end_time: "",
        is_all_day: true,
        is_recurring: false,
        recurrence_type: "",
        recurring_until: "",
        tags: [],
    });

    useEffect(() => {
        setLocalCurrentTasks(currentTasks || []);
        setLocalTodayTasks(todayTasks || []);
        setLocalOverdueTasks(overdueTasks || []);
        setLocalUpcomingTasks(upcomingTasks || []);
    }, [currentTasks, todayTasks, overdueTasks, upcomingTasks]);

    const handleQuickTaskSubmit = (e) => {
        e.preventDefault();
        router.post(route("tasks.store"), quickTask, {
            onSuccess: () => {
                setQuickTask({
                    title: "",
                    description: "",
                    category_id: "",
                    priority: "medium",
                    due_date: "",
                    start_time: "",
                    end_time: "",
                    is_all_day: true,
                    is_recurring: false,
                    recurrence_type: "",
                    recurring_until: "",
                    tags: [],
                });
                setShowQuickTask(false);
                toast.success("Task created successfully!");
            },
        });
    };

    const toggleTaskStatus = (task) => {
        const newStatus = task.status === "completed" ? "pending" : "completed";

        // Update local state immediately for instant feedback
        const updateTaskInList = (taskList, setTaskList) => {
            setTaskList(
                taskList.map((t) =>
                    t.id === task.id
                        ? {
                              ...t,
                              status: newStatus,
                              completed_at:
                                  newStatus === "completed"
                                      ? new Date().toISOString()
                                      : null,
                          }
                        : t
                )
            );
        };

        updateTaskInList(localCurrentTasks, setLocalCurrentTasks);
        updateTaskInList(localTodayTasks, setLocalTodayTasks);
        updateTaskInList(localOverdueTasks, setLocalOverdueTasks);
        updateTaskInList(localUpcomingTasks, setLocalUpcomingTasks);

        // Send request to server
        router.post(
            route("tasks.toggle-status", task.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        newStatus === "completed"
                            ? "Task completed!"
                            : "Task marked as pending"
                    );
                },
                onError: () => {
                    // Revert changes on error
                    const revertStatus =
                        newStatus === "completed" ? "pending" : "completed";
                    updateTaskInList(localCurrentTasks, setLocalCurrentTasks);
                    updateTaskInList(localTodayTasks, setLocalTodayTasks);
                    updateTaskInList(localOverdueTasks, setLocalOverdueTasks);
                    updateTaskInList(localUpcomingTasks, setLocalUpcomingTasks);
                    toast.error("Failed to update task status");
                },
            }
        );
    };

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

    const formatDate = (date) => {
        if (!date) return "";
        return new Date(date).toLocaleDateString();
    };

    const isOverdue = (dueDate, status) => {
        if (!dueDate || status === "completed") return false;
        return (
            new Date(dueDate) < new Date() &&
            new Date(dueDate).toDateString() !== new Date().toDateString()
        );
    };

    return (
        <TodoLayout header="Dashboard">
            <Head title="Dashboard" />

            <div className="space-y-4 sm:space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <div className="card">
                        <div className="p-4 sm:p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <CheckSquare className="h-5 w-5 sm:h-6 sm:w-6 text-primary-500" />
                                </div>
                                <div className="ml-4 sm:ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-xs sm:text-sm font-medium text-adaptive-muted truncate">
                                            Total Tasks
                                        </dt>
                                        <dd className="text-base sm:text-lg font-medium text-adaptive-primary">
                                            {stats.total_tasks}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="p-4 sm:p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                                </div>
                                <div className="ml-4 sm:ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-xs sm:text-sm font-medium text-adaptive-muted truncate">
                                            Completed
                                        </dt>
                                        <dd className="text-base sm:text-lg font-medium text-adaptive-primary">
                                            {stats.completed_tasks}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="p-4 sm:p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-secondary-500" />
                                </div>
                                <div className="ml-4 sm:ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-xs sm:text-sm font-medium text-adaptive-muted truncate">
                                            Pending
                                        </dt>
                                        <dd className="text-base sm:text-lg font-medium text-adaptive-primary">
                                            {stats.pending_tasks}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="p-4 sm:p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-accent-500" />
                                </div>
                                <div className="ml-4 sm:ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-xs sm:text-sm font-medium text-adaptive-muted truncate">
                                            Completion Rate
                                        </dt>
                                        <dd className="text-base sm:text-lg font-medium text-adaptive-primary">
                                            {stats.completion_rate}%
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Widgets Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <WeatherWidget />
                    <NewsWidget />
                </div>

                {/* Quick Actions */}
                <div className="card p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                        <h2 className="text-base sm:text-lg font-medium text-adaptive-primary">
                            Quick Actions
                        </h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowTaskModal(true)}
                                className="btn-accent"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                New Task
                            </button>
                            <button
                                onClick={() => setShowQuickTask(!showQuickTask)}
                                className="btn-primary"
                            >
                                <Zap className="mr-2 h-4 w-4" />
                                Quick Task
                            </button>
                            <button
                                className="btn-secondary"
                                onClick={() => setShowScheduleModal(true)}
                            >
                                <Calendar className="mr-2 h-4 w-4" />
                                Schedule
                            </button>
                        </div>
                    </div>

                    {showQuickTask && (
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                            <form
                                onSubmit={handleQuickTaskSubmit}
                                className="space-y-4"
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        Create Quick Task
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => setShowQuickTask(false)}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <div>
                                    <input
                                        type="text"
                                        placeholder="Task title..."
                                        value={quickTask.title}
                                        onChange={(e) =>
                                            setQuickTask({
                                                ...quickTask,
                                                title: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    <select
                                        value={quickTask.category_id}
                                        onChange={(e) =>
                                            setQuickTask({
                                                ...quickTask,
                                                category_id: e.target.value,
                                            })
                                        }
                                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                                    >
                                        <option value="">
                                            Select Category
                                        </option>
                                        {(categories || []).map((category) => (
                                            <option
                                                key={category.id}
                                                value={category.id}
                                            >
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>

                                    <select
                                        value={quickTask.priority}
                                        onChange={(e) =>
                                            setQuickTask({
                                                ...quickTask,
                                                priority: e.target.value,
                                            })
                                        }
                                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                                    >
                                        <option value="low">
                                            Low Priority
                                        </option>
                                        <option value="medium">
                                            Medium Priority
                                        </option>
                                        <option value="high">
                                            High Priority
                                        </option>
                                        <option value="urgent">Urgent</option>
                                    </select>

                                    <input
                                        type="date"
                                        value={quickTask.due_date}
                                        onChange={(e) =>
                                            setQuickTask({
                                                ...quickTask,
                                                due_date: e.target.value,
                                            })
                                        }
                                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                                    />
                                </div>

                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowQuickTask(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Create Task
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <button
                            onClick={() => setShowTaskModal(true)}
                            className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                        >
                            <Plus className="h-5 w-5 text-blue-500 mr-3" />
                            <div>
                                <h3 className="text-sm text-left font-medium text-gray-900 dark:text-gray-100">
                                    Create Task
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Add a new task with full details
                                </p>
                            </div>
                        </button>

                        <Link
                            href={route("categories.create")}
                            className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                        >
                            <Target className="h-5 w-5 text-green-500 mr-3" />
                            <div>
                                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    New Category
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Organize tasks with categories
                                </p>
                            </div>
                        </Link>

                        <Link
                            href={route("tasks.index")}
                            className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                        >
                            <Zap className="h-5 w-5 text-yellow-500 mr-3" />
                            <div>
                                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    View All Tasks
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    See your complete task list
                                </p>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Current Tasks */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Current Tasks */}
                    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
                        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100">
                                Current Tasks
                            </h2>
                        </div>
                        <div className="p-4 sm:p-6">
                            {localCurrentTasks.length === 0 ? (
                                <div className="text-center py-8">
                                    <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                                        No current tasks
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        All caught up!
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {localCurrentTasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                                        >
                                            <div className="flex items-center space-x-3 flex-1">
                                                <button
                                                    onClick={() =>
                                                        toggleTaskStatus(task)
                                                    }
                                                    className="flex-shrink-0"
                                                >
                                                    {getStatusIcon(task.status)}
                                                </button>
                                                <div className="flex-1 min-w-0">
                                                    <p
                                                        className={`text-sm font-medium ${
                                                            task.status ===
                                                            "completed"
                                                                ? "text-gray-500 dark:text-gray-400 line-through"
                                                                : "text-gray-900 dark:text-gray-100"
                                                        }`}
                                                    >
                                                        {task.title}
                                                    </p>
                                                    {task.category && (
                                                        <div className="flex items-center space-x-1 mt-1">
                                                            <div
                                                                className="w-2 h-2 rounded-full"
                                                                style={{
                                                                    backgroundColor:
                                                                        task
                                                                            .category
                                                                            .color,
                                                                }}
                                                            />
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                {
                                                                    task
                                                                        .category
                                                                        .name
                                                                }
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span
                                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                                                        task.priority
                                                    )}`}
                                                >
                                                    {task.priority
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                        task.priority.slice(1)}
                                                </span>
                                                <button
                                                    onClick={() => {
                                                        setSelectedTask(task);
                                                        setShowViewModal(true);
                                                    }}
                                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedTask(task);
                                                        setShowEditModal(true);
                                                    }}
                                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Today's Tasks */}
                    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
                        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100">
                                Today's Tasks
                            </h2>
                        </div>
                        <div className="p-4 sm:p-6">
                            {localTodayTasks.length === 0 ? (
                                <div className="text-center py-8">
                                    <CalendarDays className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                                        No tasks for today
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        Enjoy your day!
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {localTodayTasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                                        >
                                            <div className="flex items-center space-x-3 flex-1">
                                                <button
                                                    onClick={() =>
                                                        toggleTaskStatus(task)
                                                    }
                                                    className="flex-shrink-0"
                                                >
                                                    {getStatusIcon(task.status)}
                                                </button>
                                                <div className="flex-1 min-w-0">
                                                    <p
                                                        className={`text-sm font-medium ${
                                                            task.status ===
                                                            "completed"
                                                                ? "text-gray-500 dark:text-gray-400 line-through"
                                                                : "text-gray-900 dark:text-gray-100"
                                                        }`}
                                                    >
                                                        {task.title}
                                                    </p>
                                                    {task.due_date && (
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                            Due:{" "}
                                                            {formatDate(
                                                                task.due_date
                                                            )}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span
                                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                                                        task.priority
                                                    )}`}
                                                >
                                                    {task.priority
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                        task.priority.slice(1)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Overdue and Upcoming Tasks */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Overdue Tasks */}
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                                <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                                Overdue Tasks
                            </h2>
                        </div>
                        <div className="p-6">
                            {localOverdueTasks.length === 0 ? (
                                <div className="text-center py-8">
                                    <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                                        No overdue tasks
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        Great job staying on top!
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {localOverdueTasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                                        >
                                            <div className="flex items-center space-x-3 flex-1">
                                                <button
                                                    onClick={() =>
                                                        toggleTaskStatus(task)
                                                    }
                                                    className="flex-shrink-0"
                                                >
                                                    {getStatusIcon(task.status)}
                                                </button>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                        {task.title}
                                                    </p>
                                                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                                        Overdue since{" "}
                                                        {formatDate(
                                                            task.due_date
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span
                                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                                                        task.priority
                                                    )}`}
                                                >
                                                    {task.priority
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                        task.priority.slice(1)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Upcoming Tasks */}
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                                <Calendar className="h-5 w-5 text-blue-500 mr-2" />
                                Upcoming Tasks
                            </h2>
                        </div>
                        <div className="p-6">
                            {localUpcomingTasks.length === 0 ? (
                                <div className="text-center py-8">
                                    <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                                        No upcoming tasks
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        Next 7 days are clear
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {localUpcomingTasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                                        >
                                            <div className="flex items-center space-x-3 flex-1">
                                                <button
                                                    onClick={() =>
                                                        toggleTaskStatus(task)
                                                    }
                                                    className="flex-shrink-0"
                                                >
                                                    {getStatusIcon(task.status)}
                                                </button>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-2">
                                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                            {task.title}
                                                        </p>
                                                        {task.is_recurring && (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                                                                Recurring
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        Due:{" "}
                                                        {formatDate(
                                                            task.due_date
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span
                                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                                                        task.priority
                                                    )}`}
                                                >
                                                    {task.priority
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                        task.priority.slice(1)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <TaskModal
                show={showTaskModal}
                onClose={() => setShowTaskModal(false)}
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

            <ScheduleModal
                show={showScheduleModal}
                onClose={() => setShowScheduleModal(false)}
                currentTasks={localCurrentTasks}
                todayTasks={localTodayTasks}
                overdueTasks={localOverdueTasks}
                upcomingTasks={localUpcomingTasks}
                weeklyTasks={weeklyTasks}
                toggleTaskStatus={toggleTaskStatus}
                setSelectedTask={setSelectedTask}
                setShowViewModal={setShowViewModal}
                setShowEditModal={setShowEditModal}
            />
        </TodoLayout>
    );
}

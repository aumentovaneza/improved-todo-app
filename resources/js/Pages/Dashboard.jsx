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

export default function Dashboard({
    currentTasks = [],
    todayTasks = [],
    overdueTasks = [],
    upcomingTasks = [],
    weeklyTasks = [],
    upcomingPayments = [],
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

    const formatCurrency = (value, currency = "PHP") =>
        new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency,
            maximumFractionDigits: 2,
        }).format(value ?? 0);

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
                toast.success("Task saved. You can add details anytime.");
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
                            ? "Nice work. Task set to done."
                            : "Task is back on your list."
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
                    toast.error(
                        "We couldn't update that just now. Try again when you’re ready."
                    );
                },
            }
        );
    };

    const handleDeleteTask = (task) => {
        if (
            !confirm(
                `Remove "${task.title}"? You can always add it again later.`
            )
        ) {
            return;
        }

        // Helper function to remove task from a list
        const removeTaskFromList = (taskList, setTaskList) => {
            setTaskList(taskList.filter((t) => t.id !== task.id));
        };

        // Store original state for potential revert
        const originalCurrentTasks = [...localCurrentTasks];
        const originalTodayTasks = [...localTodayTasks];
        const originalOverdueTasks = [...localOverdueTasks];
        const originalUpcomingTasks = [...localUpcomingTasks];

        // Optimistically remove the task from all lists
        removeTaskFromList(localCurrentTasks, setLocalCurrentTasks);
        removeTaskFromList(localTodayTasks, setLocalTodayTasks);
        removeTaskFromList(localOverdueTasks, setLocalOverdueTasks);
        removeTaskFromList(localUpcomingTasks, setLocalUpcomingTasks);

        // Send delete request to server
        router.delete(route("tasks.destroy", task.id), {
            preserveScroll: true,
            preserveState: true,
            only: [], // Don't reload any data
            onSuccess: () => {
                toast.success("Task removed. It’s here if you need it again.");
            },
            onError: () => {
                // Revert to original state on error
                setLocalCurrentTasks(originalCurrentTasks);
                setLocalTodayTasks(originalTodayTasks);
                setLocalOverdueTasks(originalOverdueTasks);
                setLocalUpcomingTasks(originalUpcomingTasks);
                toast.error(
                    "We couldn’t remove that just now. Please try again."
                );
            },
        });
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case "urgent":
                return "text-amber-700 bg-amber-100/70 dark:text-amber-200 dark:bg-amber-900/20";
            case "high":
                return "text-orange-700 bg-orange-100/70 dark:text-orange-200 dark:bg-orange-900/20";
            case "medium":
                return "text-sky-700 bg-sky-100/70 dark:text-sky-200 dark:bg-sky-900/20";
            case "low":
                return "text-emerald-700 bg-emerald-100/70 dark:text-emerald-200 dark:bg-emerald-900/20";
            default:
                return "text-slate-600 bg-slate-100/70 dark:text-slate-300 dark:bg-slate-800/40";
        }
    };

    const getPriorityLabel = (priority) =>
        priority === "urgent"
            ? "Focus"
            : priority.charAt(0).toUpperCase() + priority.slice(1);

    const getStatusIcon = (status) => {
        switch (status) {
            case "completed":
                return (
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                );
            case "in_progress":
                return <Clock className="h-5 w-5 text-sky-500" />;
            case "cancelled":
                return <AlertTriangle className="h-5 w-5 text-slate-400" />;
            default:
                return <Circle className="h-5 w-5 text-slate-300" />;
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
                                <div className="flex-shrink-0 rounded-full bg-wevie-teal/10 p-2">
                                    <CheckSquare className="h-5 w-5 sm:h-6 sm:w-6 text-wevie-teal" />
                                </div>
                                <div className="ml-4 sm:ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-xs sm:text-sm font-medium text-adaptive-muted truncate">
                                            Total tasks
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
                                <div className="flex-shrink-0 rounded-full bg-emerald-100/60 p-2 dark:bg-emerald-900/30">
                                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500" />
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
                                <div className="flex-shrink-0 rounded-full bg-sky-100/60 p-2 dark:bg-sky-900/30">
                                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-sky-500" />
                                </div>
                                <div className="ml-4 sm:ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-xs sm:text-sm font-medium text-adaptive-muted truncate">
                                            Open tasks
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
                                <div className="flex-shrink-0 rounded-full bg-wevie-mint/20 p-2 dark:bg-wevie-mint/10">
                                    <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-wevie-mint" />
                                </div>
                                <div className="ml-4 sm:ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-xs sm:text-sm font-medium text-adaptive-muted truncate">
                                            Completion pace
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
                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                    <WeatherWidget />
                </div>

                {/* Quick Actions */}
                <div className="card p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                        <h2 className="text-base sm:text-lg font-medium text-adaptive-primary">
                            Gentle shortcuts
                        </h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowTaskModal(true)}
                                className="btn-primary"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                New task
                            </button>
                            <button
                                onClick={() => setShowQuickTask(!showQuickTask)}
                                className="btn-secondary"
                            >
                                <Zap className="mr-2 h-4 w-4" />
                                Quick add
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
                        <div className="bg-light-hover dark:bg-dark-hover rounded-xl p-4 mb-4">
                            <form
                                onSubmit={handleQuickTaskSubmit}
                                className="space-y-4"
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-medium text-light-primary dark:text-dark-primary">
                                        Quick task
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => setShowQuickTask(false)}
                                        className="text-light-muted hover:text-light-secondary dark:text-dark-muted dark:hover:text-dark-secondary"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <div>
                                    <input
                                        type="text"
                                        placeholder="What would you like to do?"
                                        value={quickTask.title}
                                        onChange={(e) =>
                                            setQuickTask({
                                                ...quickTask,
                                                title: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-light-border/70 dark:border-dark-border/70 rounded-xl focus:ring-wevie-teal/40 focus:border-wevie-teal dark:bg-dark-card dark:text-dark-primary"
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
                                        className="px-3 py-2 border border-light-border/70 dark:border-dark-border/70 rounded-xl focus:ring-wevie-teal/40 focus:border-wevie-teal dark:bg-dark-card dark:text-dark-primary"
                                    >
                                        <option value="">
                                            Category (optional)
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
                                        className="px-3 py-2 border border-light-border/70 dark:border-dark-border/70 rounded-xl focus:ring-wevie-teal/40 focus:border-wevie-teal dark:bg-dark-card dark:text-dark-primary"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Focus</option>
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
                                        className="px-3 py-2 border border-light-border/70 dark:border-dark-border/70 rounded-xl focus:ring-wevie-teal/40 focus:border-wevie-teal dark:bg-dark-card dark:text-dark-primary"
                                    />
                                </div>

                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowQuickTask(false)}
                                        className="px-4 py-2 text-sm font-medium text-light-secondary dark:text-dark-secondary bg-white dark:bg-dark-card border border-light-border/70 dark:border-dark-border/70 rounded-xl hover:bg-light-hover dark:hover:bg-dark-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wevie-teal/30"
                                    >
                                        Not now
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-wevie-teal to-wevie-mint border border-transparent rounded-xl hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wevie-teal/40"
                                    >
                                        Save task
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <button
                            onClick={() => setShowTaskModal(true)}
                            className="card-hover flex items-center p-4"
                        >
                            <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-full bg-wevie-teal/10">
                                <Plus className="h-5 w-5 text-wevie-teal" />
                            </div>
                            <div>
                                <h3 className="text-sm text-left font-medium text-light-primary dark:text-dark-primary">
                                    Create a task
                                </h3>
                                <p className="text-xs text-light-muted dark:text-dark-muted">
                                    Add details now or later
                                </p>
                            </div>
                        </button>

                        <Link
                            href={route("categories.create")}
                            className="card-hover flex items-center p-4"
                        >
                            <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100/60 dark:bg-emerald-900/30">
                                <Target className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-light-primary dark:text-dark-primary">
                                    New category
                                </h3>
                                <p className="text-xs text-light-muted dark:text-dark-muted">
                                    Group tasks gently
                                </p>
                            </div>
                        </Link>

                        <Link
                            href={route("tasks.index")}
                            className="card-hover flex items-center p-4"
                        >
                            <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-full bg-amber-100/60 dark:bg-amber-900/30">
                                <Zap className="h-5 w-5 text-amber-500" />
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-light-primary dark:text-dark-primary">
                                    See all tasks
                                </h3>
                                <p className="text-xs text-light-muted dark:text-dark-muted">
                                    Everything in one place
                                </p>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Current Tasks */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Upcoming Payments */}
                    <div className="card">
                        <div className="px-4 sm:px-6 py-4 border-b border-light-border/70 dark:border-dark-border/70">
                            <h2 className="text-base sm:text-lg font-medium text-light-primary dark:text-dark-primary">
                                Upcoming payments
                            </h2>
                        </div>
                        <div className="p-4 sm:p-6">
                            {upcomingPayments.length === 0 ? (
                                <div className="text-center py-8">
                                    <Calendar className="mx-auto h-12 w-12 text-light-muted dark:text-dark-muted" />
                                    <h3 className="mt-2 text-sm font-medium text-light-primary dark:text-dark-primary">
                                        Nothing scheduled yet
                                    </h3>
                                    <p className="mt-1 text-sm text-light-muted dark:text-dark-muted">
                                        We’ll keep watch when you add one.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {upcomingPayments.map((payment) => (
                                        <div
                                            key={payment.id}
                                            className="flex items-center justify-between p-3 bg-light-hover dark:bg-dark-hover rounded-xl"
                                        >
                                            <div className="flex items-center space-x-3 flex-1">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-light-primary dark:text-dark-primary">
                                                        {payment.description}
                                                    </p>
                                                    {payment.loan && (
                                                        <div className="flex items-center space-x-1 mt-1">
                                                            <span className="text-xs text-amber-700 dark:text-amber-200">
                                                                Loan ·{" "}
                                                                {payment.loan.name}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {!payment.loan &&
                                                        payment.category && (
                                                            <div className="flex items-center space-x-1 mt-1">
                                                                <div
                                                                    className="w-2 h-2 rounded-full"
                                                                    style={{
                                                                        backgroundColor:
                                                                            payment
                                                                                .category
                                                                                .color,
                                                                    }}
                                                                />
                                                                <span className="text-xs text-light-muted dark:text-dark-muted">
                                                                    {
                                                                        payment
                                                                            .category
                                                                            .name
                                                                    }
                                                                </span>
                                                            </div>
                                                        )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-light-primary dark:text-dark-primary">
                                                    {formatCurrency(
                                                        payment.amount,
                                                        payment.currency ?? "PHP"
                                                    )}
                                                </p>
                                                <p className="text-xs text-light-muted dark:text-dark-muted">
                                                    {formatDate(
                                                        payment.occurred_at
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Today's Tasks */}
                    <div className="card">
                        <div className="px-4 sm:px-6 py-4 border-b border-light-border/70 dark:border-dark-border/70">
                            <h2 className="text-base sm:text-lg font-medium text-light-primary dark:text-dark-primary">
                                Today’s tasks
                            </h2>
                        </div>
                        <div className="p-4 sm:p-6">
                            {localTodayTasks.length === 0 ? (
                                <div className="text-center py-8">
                                    <CalendarDays className="mx-auto h-12 w-12 text-light-muted dark:text-dark-muted" />
                                    <h3 className="mt-2 text-sm font-medium text-light-primary dark:text-dark-primary">
                                        No tasks today
                                    </h3>
                                    <p className="mt-1 text-sm text-light-muted dark:text-dark-muted">
                                        Still here whenever you need it.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {localTodayTasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className="flex items-center justify-between p-3 bg-light-hover dark:bg-dark-hover rounded-xl"
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
                                                                ? "text-light-muted dark:text-dark-muted line-through"
                                                                : "text-light-primary dark:text-dark-primary"
                                                        }`}
                                                    >
                                                        {task.title}
                                                    </p>
                                                    {task.due_date && (
                                                        <p className="text-xs text-light-muted dark:text-dark-muted mt-1">
                                                            Planned for{" "}
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
                                                    {getPriorityLabel(
                                                        task.priority
                                                    )}
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
                    <div className="card">
                        <div className="px-6 py-4 border-b border-light-border/70 dark:border-dark-border/70">
                            <h2 className="text-base sm:text-lg font-medium text-light-primary dark:text-dark-primary flex items-center">
                                <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                                Tasks to revisit
                            </h2>
                        </div>
                        <div className="p-6">
                            {localOverdueTasks.length === 0 ? (
                                <div className="text-center py-8">
                                    <CheckCircle className="mx-auto h-12 w-12 text-emerald-400" />
                                    <h3 className="mt-2 text-sm font-medium text-light-primary dark:text-dark-primary">
                                        Nothing waiting here
                                    </h3>
                                    <p className="mt-1 text-sm text-light-muted dark:text-dark-muted">
                                        You’re all set for now.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {localOverdueTasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className="flex items-center justify-between p-3 bg-amber-50/70 dark:bg-amber-900/10 rounded-xl border border-amber-200/60 dark:border-amber-800/40"
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
                                                    <p className="text-sm font-medium text-light-primary dark:text-dark-primary">
                                                        {task.title}
                                                    </p>
                                                    <p className="text-xs text-amber-700 dark:text-amber-200 mt-1">
                                                        Planned for{" "}
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
                                                    {getPriorityLabel(
                                                        task.priority
                                                    )}
                                                </span>
                                                <button
                                                    onClick={() => handleDeleteTask(task)}
                                                    className="text-light-muted hover:text-rose-500 dark:text-dark-muted dark:hover:text-rose-300"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Upcoming Tasks */}
                    <div className="card">
                        <div className="px-6 py-4 border-b border-light-border/70 dark:border-dark-border/70">
                            <h2 className="text-base sm:text-lg font-medium text-light-primary dark:text-dark-primary flex items-center">
                                <Calendar className="h-5 w-5 text-wevie-teal mr-2" />
                                Coming up
                            </h2>
                        </div>
                        <div className="p-6">
                            {localUpcomingTasks.length === 0 ? (
                                <div className="text-center py-8">
                                    <Calendar className="mx-auto h-12 w-12 text-light-muted dark:text-dark-muted" />
                                    <h3 className="mt-2 text-sm font-medium text-light-primary dark:text-dark-primary">
                                        Nothing scheduled yet
                                    </h3>
                                    <p className="mt-1 text-sm text-light-muted dark:text-dark-muted">
                                        Add plans when it feels right.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {localUpcomingTasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className="flex items-center justify-between p-3 bg-light-hover dark:bg-dark-hover rounded-xl"
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
                                                        <p className="text-sm font-medium text-light-primary dark:text-dark-primary">
                                                            {task.title}
                                                        </p>
                                                        {task.is_recurring && (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-violet-100/70 text-violet-700 dark:bg-violet-900/20 dark:text-violet-200">
                                                                Steady rhythm
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-light-muted dark:text-dark-muted mt-1">
                                                        Planned for{" "}
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
                                                    {getPriorityLabel(
                                                        task.priority
                                                    )}
                                                </span>
                                                <button
                                                    onClick={() => handleDeleteTask(task)}
                                                    className="text-light-muted hover:text-rose-500 dark:text-dark-muted dark:hover:text-rose-300"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
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

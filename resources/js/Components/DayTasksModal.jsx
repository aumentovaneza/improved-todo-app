import Modal from "./Modal";
import SecondaryButton from "./SecondaryButton";
import {
    Calendar,
    Clock,
    CheckCircle,
    Circle,
    Eye,
    Edit,
    AlertTriangle,
} from "lucide-react";

export default function DayTasksModal({
    show,
    onClose,
    selectedDate,
    tasks = [],
    transactions = [],
    onTaskView,
    onTaskEdit,
    onTaskStatusToggle,
}) {
    if (!selectedDate) return null;

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return "";
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

    const getTimeDisplay = (task) => {
        if (task.is_all_day || (!task.start_time && !task.end_time)) {
            return "All day";
        }

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
            case "pending":
            default:
                return <Circle className="h-5 w-5 text-gray-400" />;
        }
    };

    const isOverdue = (task) => {
        if (!task.due_date || task.status === "completed") return false;
        const taskDate = new Date(task.due_date);
        const now = new Date();
        return taskDate < now && taskDate.toDateString() !== now.toDateString();
    };

    const formatCurrency = (amount, currency = "PHP") =>
        new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency,
            maximumFractionDigits: 0,
        }).format(amount ?? 0);

    const getTransactionTypeStyle = (type) => {
        switch (type) {
            case "income":
                return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400";
            case "expense":
                return "bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400";
            case "savings":
                return "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400";
            default:
                return "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400";
        }
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="xl">
            <div className="max-h-[80vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                            <Calendar className="h-6 w-6 text-blue-500" />
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                    Tasks and finances (income, expenses, savings) for{" "}
                                    {formatDate(selectedDate)}
                                </h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {tasks.length}{" "}
                                    {tasks.length === 1 ? "task" : "tasks"},{" "}
                                    {transactions.length}{" "}
                                    {transactions.length === 1
                                        ? "transaction"
                                        : "transactions"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {tasks.length === 0 && transactions.length === 0 ? (
                        <div className="text-center py-12">
                            <Calendar className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400 text-lg">
                                No items scheduled for this day
                            </p>
                            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                                Create a new task or transaction to get started
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {tasks.length > 0 && (
                                <div className="space-y-4">
                                    {tasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className={`p-4 border rounded-lg transition-all duration-200 hover:shadow-md ${
                                                task.status === "completed"
                                                    ? "bg-gray-50 dark:bg-gray-900/10 border-gray-200 dark:border-gray-700"
                                                    : isOverdue(task)
                                                    ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800"
                                                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                            }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start space-x-3 flex-1">
                                                    <button
                                                        onClick={() =>
                                                            onTaskStatusToggle &&
                                                            onTaskStatusToggle(
                                                                task
                                                            )
                                                        }
                                                        className="mt-1 hover:scale-110 transition-transform duration-200"
                                                    >
                                                        {getStatusIcon(
                                                            task.status
                                                        )}
                                                    </button>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center space-x-2 mb-2">
                                                            <h3
                                                                className={`font-medium text-gray-900 dark:text-gray-100 ${
                                                                    task.status ===
                                                                    "completed"
                                                                        ? "line-through opacity-60"
                                                                        : ""
                                                                }`}
                                                            >
                                                                {task.title}
                                                            </h3>
                                                            {task.is_recurring && (
                                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                                                                    Recurring
                                                                </span>
                                                            )}
                                                            {isOverdue(task) && (
                                                                <AlertTriangle className="h-4 w-4 text-red-500" />
                                                            )}
                                                        </div>

                                                        {task.description && (
                                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                                                                {task.description}
                                                            </p>
                                                        )}

                                                        <div className="flex flex-wrap items-center gap-3 text-sm">
                                                            <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                                                                <Clock className="h-4 w-4" />
                                                                <span>
                                                                    {getTimeDisplay(
                                                                        task
                                                                    )}
                                                                </span>
                                                            </div>

                                                            <span
                                                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                                                                    task.priority
                                                                )}`}
                                                            >
                                                                {task.priority
                                                                    .charAt(0)
                                                                    .toUpperCase() +
                                                                    task.priority.slice(
                                                                        1
                                                                    )}
                                                            </span>

                                                            {task.category && (
                                                                <div className="flex items-center space-x-1">
                                                                    <div
                                                                        className="w-3 h-3 rounded-full"
                                                                        style={{
                                                                            backgroundColor:
                                                                                task.status ===
                                                                                "completed"
                                                                                    ? "#6B7280"
                                                                                    : task
                                                                                          .category
                                                                                          .color,
                                                                        }}
                                                                    />
                                                                    <span className="text-xs text-gray-600 dark:text-gray-400">
                                                                        {
                                                                            task
                                                                                .category
                                                                                .name
                                                                        }
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {task.subtasks_count >
                                                                0 && (
                                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                    {task.completed_subtasks_count ||
                                                                        0}
                                                                    /
                                                                    {
                                                                        task.subtasks_count
                                                                    }{" "}
                                                                    subtasks
                                                                </span>
                                                            )}
                                                        </div>

                                                        {task.tags &&
                                                            task.tags.length >
                                                                0 && (
                                                                <div className="flex flex-wrap gap-1 mt-2">
                                                                    {task.tags.map(
                                                                        (tag) => (
                                                                            <span
                                                                                key={
                                                                                    tag.id
                                                                                }
                                                                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                                                                                style={{
                                                                                    backgroundColor:
                                                                                        tag.color,
                                                                                }}
                                                                            >
                                                                                {
                                                                                    tag.name
                                                                                }
                                                                            </span>
                                                                        )
                                                                    )}
                                                                </div>
                                                            )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center space-x-2 ml-4">
                                                    <button
                                                        onClick={() =>
                                                            onTaskView &&
                                                            onTaskView(task)
                                                        }
                                                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                                                        title="View Task"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            onTaskEdit &&
                                                            onTaskEdit(task)
                                                        }
                                                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                                                        title="Edit Task"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {transactions.length > 0 && (
                                <div>
                                    <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Transactions
                                    </h3>
                                    <div className="space-y-3">
                                        {transactions.map((transaction) => (
                                            <div
                                                key={`transaction-${transaction.id}`}
                                                className="p-4 border rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-gray-100">
                                                            {
                                                                transaction.description
                                                            }
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {transaction.category
                                                                ?.name ??
                                                                "Uncategorized"}
                                                        </p>
                                                    </div>
                                                    <span
                                                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTransactionTypeStyle(
                                                            transaction.type
                                                        )}`}
                                                    >
                                                        {formatCurrency(
                                                            transaction.amount,
                                                            transaction.currency ??
                                                                "PHP"
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end mt-6">
                        <SecondaryButton onClick={onClose}>
                            Close
                        </SecondaryButton>
                    </div>
                </div>
            </div>
        </Modal>
    );
}

import TodoLayout from "@/Layouts/TodoLayout";
import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import {
    ArrowLeft,
    Edit,
    FolderOpen,
    CheckSquare,
    Circle,
    Eye,
    Clock,
    AlertTriangle,
    CheckCircle,
    Calendar,
} from "lucide-react";
import TaskViewModal from "@/Components/TaskViewModal";
import { toast } from "react-toastify";

export default function Show({ category }) {
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [tasks, setTasks] = useState(category.tasks || []);

    const toggleTaskStatus = (task) => {
        const newStatus = task.status === "completed" ? "pending" : "completed";

        // Update local state immediately for instant feedback
        setTasks((prevTasks) =>
            prevTasks.map((t) =>
                t.id === task.id
                    ? {
                          ...t,
                          status: newStatus,
                          completed_at:
                              newStatus === "completed" ? new Date() : null,
                      }
                    : t
            )
        );

        router.post(
            route("tasks.toggle-status", task.id),
            { status: newStatus },
            {
                preserveScroll: true,
                preserveState: true,
                only: [],
                onSuccess: () => {
                    toast.success(
                        `Task marked as ${
                            newStatus === "completed" ? "completed" : "pending"
                        }`
                    );
                },
                onError: () => {
                    // Revert the optimistic update
                    setTasks((prevTasks) =>
                        prevTasks.map((t) =>
                            t.id === task.id ? { ...t, status: task.status } : t
                        )
                    );
                    toast.error("Failed to update task status");
                },
            }
        );
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "completed":
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case "in_progress":
                return <Clock className="h-5 w-5 text-blue-500" />;
            case "cancelled":
                return <AlertTriangle className="h-5 w-5 text-red-500" />;
            default:
                return <Circle className="h-5 w-5 text-gray-400" />;
        }
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

    const isOverdue = (dueDate) => {
        if (!dueDate) return false;
        return (
            new Date(dueDate) < new Date() &&
            new Date(dueDate).toDateString() !== new Date().toDateString()
        );
    };

    return (
        <TodoLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route("categories.index")}
                            className="inline-flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {category.name}
                        </h2>
                    </div>
                    <Link
                        href={route("categories.edit", category.id)}
                        className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </Link>
                </div>
            }
        >
            <Head title={category.name} />
            <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
                {/* Category Info Card */}
                <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div
                            className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${category.color}20` }}
                        >
                            <FolderOpen
                                className="w-6 h-6 sm:w-8 sm:h-8"
                                style={{ color: category.color }}
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                {category.name}
                            </h3>
                            {category.description && (
                                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-3">
                                    {category.description}
                                </p>
                            )}
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                        Color:
                                    </span>
                                    <div
                                        className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600"
                                        style={{
                                            backgroundColor: category.color,
                                        }}
                                    />
                                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-mono">
                                        {category.color}
                                    </span>
                                </div>
                                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                    {tasks?.length || 0} task
                                    {(tasks?.length || 0) !== 1 ? "s" : ""}
                                </div>
                            </div>
                            {category.tags && category.tags.length > 0 && (
                                <div className="mt-3">
                                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 block mb-2">
                                        Tags:
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        {category.tags.map((tag) => (
                                            <span
                                                key={tag.id}
                                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                                                style={{
                                                    backgroundColor: tag.color,
                                                }}
                                            >
                                                {tag.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tasks in Category */}
                {tasks && tasks.length > 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100">
                                Tasks in this category
                            </h3>
                        </div>
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {tasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                                            {/* Status Icon */}
                                            <button
                                                onClick={() =>
                                                    toggleTaskStatus(task)
                                                }
                                                className="flex-shrink-0 hover:scale-110 transition-transform"
                                                title={`Mark task as ${
                                                    task.status === "completed"
                                                        ? "pending"
                                                        : "completed"
                                                }`}
                                            >
                                                {getStatusIcon(task.status)}
                                            </button>

                                            {/* Task Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col sm:flex-row sm:items-center">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-row items-center gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedTask(
                                                                        task
                                                                    );
                                                                    setShowViewModal(
                                                                        true
                                                                    );
                                                                }}
                                                                className={`text-sm sm:text-base font-medium truncate text-left hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 cursor-pointer underline-offset-2 hover:underline hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded px-1 py-0.5 -mx-1 -my-0.5 ${
                                                                    task.status ===
                                                                    "completed"
                                                                        ? "text-gray-500 dark:text-gray-400 line-through hover:text-blue-500 dark:hover:text-blue-400"
                                                                        : "text-gray-900 dark:text-gray-100"
                                                                }`}
                                                                title="Click to view task details"
                                                            >
                                                                {task.title}
                                                            </button>
                                                            {/* Priority Badge */}
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

                                                            {/* Tags */}
                                                            {task.tags &&
                                                                task.tags
                                                                    .length >
                                                                    0 && (
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {task.tags.map(
                                                                            (
                                                                                tag
                                                                            ) => (
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

                                                        {task.description && (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedTask(
                                                                        task
                                                                    );
                                                                    setShowViewModal(
                                                                        true
                                                                    );
                                                                }}
                                                                className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 truncate text-left hover:text-blue-500 dark:hover:text-blue-400 transition-all duration-200 cursor-pointer underline-offset-2 hover:underline w-full hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded px-1 py-0.5 -mx-1 -my-0.5"
                                                                title="Click to view task details"
                                                            >
                                                                {
                                                                    task.description
                                                                }
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Task Meta Info */}
                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                    {/* Due Date and Time */}
                                                    {task.due_date && (
                                                        <div
                                                            className={`flex items-center space-x-1 ${
                                                                isOverdue(
                                                                    task.due_date
                                                                )
                                                                    ? "text-red-600 dark:text-red-400"
                                                                    : "text-gray-500 dark:text-gray-400"
                                                            }`}
                                                        >
                                                            <Calendar className="h-3 w-3" />
                                                            <span className="text-xs">
                                                                {new Date(
                                                                    task.due_date
                                                                ).toLocaleDateString()}
                                                                {!task.is_all_day &&
                                                                    (task.start_time ||
                                                                        task.end_time) && (
                                                                        <span className="ml-1 font-medium">
                                                                            {(() => {
                                                                                const formatTime =
                                                                                    (
                                                                                        timeStr
                                                                                    ) => {
                                                                                        if (
                                                                                            !timeStr
                                                                                        )
                                                                                            return "";
                                                                                        // Handle both time formats (HH:MM and full datetime)
                                                                                        if (
                                                                                            timeStr.includes(
                                                                                                "T"
                                                                                            )
                                                                                        ) {
                                                                                            return new Date(
                                                                                                timeStr
                                                                                            ).toLocaleTimeString(
                                                                                                [],
                                                                                                {
                                                                                                    hour: "2-digit",
                                                                                                    minute: "2-digit",
                                                                                                }
                                                                                            );
                                                                                        }
                                                                                        return timeStr;
                                                                                    };

                                                                                if (
                                                                                    task.start_time &&
                                                                                    task.end_time
                                                                                ) {
                                                                                    return `${formatTime(
                                                                                        task.start_time
                                                                                    )} - ${formatTime(
                                                                                        task.end_time
                                                                                    )}`;
                                                                                } else if (
                                                                                    task.end_time
                                                                                ) {
                                                                                    return `Due: ${formatTime(
                                                                                        task.end_time
                                                                                    )}`;
                                                                                } else if (
                                                                                    task.start_time
                                                                                ) {
                                                                                    return `From: ${formatTime(
                                                                                        task.start_time
                                                                                    )}`;
                                                                                }
                                                                                return "";
                                                                            })()}
                                                                        </span>
                                                                    )}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setSelectedTask(task);
                                                setShowViewModal(true);
                                            }}
                                            className="p-1 sm:p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ml-2"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-sm text-center">
                        <div className="text-gray-400 dark:text-gray-500 mb-4">
                            <CheckSquare className="mx-auto h-10 w-10 sm:h-12 sm:w-12" />
                        </div>
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                            No tasks in this category
                        </h3>
                        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4">
                            Start organizing your work by adding tasks to this
                            category.
                        </p>
                        <Link
                            href={route("tasks.index")}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                        >
                            View All Tasks
                        </Link>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                        href={route("categories.edit", category.id)}
                        className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Category
                    </Link>
                    <Link
                        href={route("categories.index")}
                        className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Categories
                    </Link>
                </div>
            </div>
            <TaskViewModal
                show={showViewModal}
                onClose={() => {
                    setShowViewModal(false);
                    setSelectedTask(null);
                }}
                task={selectedTask}
            />
        </TodoLayout>
    );
}

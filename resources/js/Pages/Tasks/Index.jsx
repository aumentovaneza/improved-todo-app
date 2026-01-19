import TodoLayout from "@/Layouts/TodoLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useState, useEffect } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    Plus,
    Search,
    Filter,
    Calendar,
    Clock,
    CheckCircle,
    Circle,
    AlertTriangle,
    MoreVertical,
    Edit,
    Trash2,
    GripVertical,
    Eye,
    ListTodo,
    ChevronDown,
    ChevronRight,
    Star,
    User,
    Tag as TagIcon,
    CalendarDays,
    Clock3,
    Flag,
    CheckSquare,
    Square,
    Play,
    Pause,
    XCircle,
    FolderOpen,
} from "lucide-react";
import TaskModal from "@/Components/TaskModal";
import TaskViewModal from "@/Components/TaskViewModal";
import TaskEditModal from "@/Components/TaskEditModal";
import QuickSubtaskModal from "@/Components/QuickSubtaskModal";
import Toast from "@/Components/Toast";
import { toast } from "react-toastify";

function SortableTask({
    task,
    globalIndex,
    getPriorityColor,
    getStatusIcon,
    getStatusColor,
    isOverdue,
    toggleTaskStatus,
    handleTaskStatusChange,
    setSelectedTask,
    setShowViewModal,
    setShowEditModal,
    setShowSubtaskModal,
    handleDeleteTask,
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: task.id.toString(),
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const getPriorityIcon = (priority) => {
        switch (priority) {
            case "urgent":
                return <Flag className="h-3 w-3 text-red-500" />;
            case "high":
                return <Flag className="h-3 w-3 text-orange-500" />;
            case "medium":
                return <Flag className="h-3 w-3 text-yellow-500" />;
            case "low":
                return <Flag className="h-3 w-3 text-green-500" />;
            default:
                return <Flag className="h-3 w-3 text-gray-400" />;
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group relative bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 ${
                isDragging ? "shadow-lg z-10" : ""
            }`}
        >
            <div className="flex items-center px-4 py-3">
                {/* Drag Handle */}
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div
                        {...attributes}
                        {...listeners}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Drag to reorder"
                    >
                        <GripVertical className="h-4 w-4" />
                    </div>

                    {/* Status Checkbox */}
                    <button
                        onClick={() => toggleTaskStatus(task)}
                        className="flex-shrink-0 hover:scale-110 transition-transform"
                        title={`Mark task as ${
                            task.status === "completed"
                                ? "pending"
                                : "completed"
                        }`}
                    >
                        {task.status === "completed" ? (
                            <CheckSquare className="h-5 w-5 text-green-500" />
                        ) : (
                            <Square className="h-5 w-5 text-gray-400 hover:text-green-500" />
                        )}
                    </button>


                    {/* Task Title */}
                    <div className="flex-1 min-w-0">
                        <button
                            onClick={() => {
                                setSelectedTask(task);
                                setShowViewModal(true);
                            }}
                            className={`text-left font-medium hover:text-primary-400 dark:hover:text-[#2ED7A1] transition-colors ${
                                task.status === "completed"
                                    ? "text-gray-500 dark:text-gray-400 line-through"
                                    : "text-gray-900 dark:text-gray-100"
                            }`}
                            title={task.title}
                        >
                            {task.title.length > 100 ? `${task.title.substring(0, 100)}...` : task.title}
                        </button>
                        {task.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                                {task.description}
                            </p>
                        )}
                    </div>
                </div>

                {/* Category */}
                <div className="flex items-center space-x-4 min-w-0">
                    <div className="flex items-center space-x-2 min-w-0">
                        <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{
                                backgroundColor: task.category?.color || "#6B7280",
                            }}
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-24">
                            {task.category?.name || "Uncategorized"}
                        </span>
                    </div>

                    {/* Status */}
                    <div className="flex items-center space-x-2">
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                            {task.status === "in_progress" && <Play className="h-3 w-3 mr-1" />}
                            {task.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                            {task.status === "completed" && <CheckCircle className="h-3 w-3 mr-1" />}
                            {task.status === "cancelled" && <XCircle className="h-3 w-3 mr-1" />}
                            {task.status.replace("_", " ").charAt(0).toUpperCase() + task.status.replace("_", " ").slice(1)}
                        </div>
                    </div>

                    {/* Priority */}
                    <div className="flex items-center space-x-1" title={`Priority: ${task.priority}`}>
                        {getPriorityIcon(task.priority)}
                        <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                    </div>

                    {/* Due Date */}
                    {task.due_date && (
                        <div className={`flex items-center space-x-1 ${
                            isOverdue(task.due_date, task.status)
                                ? "text-red-600 dark:text-red-400"
                                : "text-gray-500 dark:text-gray-400"
                        }`}>
                            <CalendarDays className="h-4 w-4" />
                            <span className="text-xs hidden sm:inline">
                                {new Date(task.due_date).toLocaleDateString()}
                            </span>
                            <span className="text-xs sm:hidden">
                                {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                        </div>
                    )}

                    {/* Time */}
                    {task.due_date && !task.is_all_day && (task.start_time || task.end_time) && (
                        <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                            <Clock3 className="h-4 w-4" />
                            <span className="text-xs hidden sm:inline">
                                {(() => {
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
                                        const [hours, minutes] = timeStr.split(":");
                                        const hour = parseInt(hours);
                                        const ampm = hour >= 12 ? "PM" : "AM";
                                        const displayHour = hour % 12 || 12;
                                        return `${displayHour}:${minutes} ${ampm}`;
                                    };

                                    const startTime = formatTime(task.start_time);
                                    const endTime = formatTime(task.end_time);

                                    if (startTime && endTime) {
                                        return `${startTime} - ${endTime}`;
                                    } else if (startTime) {
                                        return startTime;
                                    } else if (endTime) {
                                        return endTime;
                                    }
                                    return "";
                                })()}
                            </span>
                        </div>
                    )}

                    {/* Subtasks */}
                    {task.subtasks_count > 0 && (
                        <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                            <ListTodo className="h-4 w-4" />
                            <span className="text-xs">
                                {task.completed_subtasks_count || 0}/{task.subtasks_count || 0}
                            </span>
                        </div>
                    )}

                    {/* Tags */}
                    {task.tags && task.tags.length > 0 && (
                        <div className="flex items-center space-x-1">
                            <TagIcon className="h-4 w-4 text-gray-400" />
                            <div className="flex space-x-1">
                                {task.tags.slice(0, 2).map((tag) => (
                                    <span
                                        key={tag.id}
                                        className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium text-white"
                                        style={{ backgroundColor: tag.color }}
                                    >
                                        {tag.name}
                                    </span>
                                ))}
                                {task.tags.length > 2 && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        +{task.tags.length - 2}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => {
                                setSelectedTask(task);
                                setShowSubtaskModal(true);
                            }}
                            className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                            title="Add Subtask"
                        >
                            <ListTodo className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => {
                                setSelectedTask(task);
                                setShowViewModal(true);
                            }}
                            className="p-1 text-gray-400 hover:text-primary-400 dark:hover:text-[#2ED7A1] transition-colors"
                            title="View Task"
                        >
                            <Eye className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => {
                                setSelectedTask(task);
                                setShowEditModal(true);
                            }}
                            className="p-1 text-gray-400 hover:text-primary-400 dark:hover:text-[#2ED7A1] transition-colors"
                            title="Edit Task"
                        >
                            <Edit className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => handleDeleteTask(task)}
                            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            title="Delete Task"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Index({ categorizedTasks, categories, filters }) {
    const [allTasks, setAllTasks] = useState([]);
    const [search, setSearch] = useState(filters.search || "");
    const [statusFilter, setStatusFilter] = useState(filters.status || "");
    const [priorityFilter, setPriorityFilter] = useState(
        filters.priority || ""
    );
    const [categoryFilter, setCategoryFilter] = useState(
        filters.category_id || ""
    );
    const [dueDateFilter, setDueDateFilter] = useState(
        filters.due_date_filter || ""
    );
    const [showFilters, setShowFilters] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showSubtaskModal, setShowSubtaskModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [isTaskSubmitting, setIsTaskSubmitting] = useState(false);

    // Flatten all tasks from categorized structure
    useEffect(() => {
        const flattenedTasks = [];
        if (categorizedTasks) {
            categorizedTasks.forEach((group) => {
                if (group.tasks && group.tasks.data) {
                    group.tasks.data.forEach((task) => {
                        flattenedTasks.push({
                            ...task,
                            category: group.category,
                        });
                    });
                }
            });
        }
        setAllTasks(flattenedTasks);
    }, [categorizedTasks]);

    // Handle quick add task for specific category
    const handleQuickAddTask = (categoryId, event) => {
        event.stopPropagation();
        setSelectedCategory(categoryId);
        setShowTaskModal(true);
    };

    // Handle task status change
    const handleTaskStatusChange = (task, newStatus) => {
        // Optimistically update the task status in the UI
        setAllTasks(
            allTasks.map((t) =>
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

        // Send the status change to the server
        router.post(
            route("tasks.toggle-status", task.id),
            { status: newStatus },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    toast.success(
                        `Task status updated to ${newStatus.replace("_", " ")}`
                    );
                },
                onError: () => {
                    // Revert the optimistic update on error
                    setAllTasks(
                        allTasks.map((t) =>
                            t.id === task.id ? task : t
                        )
                    );
                    toast.error("Failed to update task status");
                },
            }
        );
    };

    // Handle task updates from modals
    const handleTaskUpdate = (updatedTask) => {
        setSelectedTask(updatedTask);
        // Also update the task in the all tasks list
        setAllTasks(
            allTasks.map((t) =>
                t.id === updatedTask.id ? updatedTask : t
            )
        );
    };

    // Handle task deletion
    const handleDeleteTask = (task) => {
        if (!confirm(`Are you sure you want to delete "${task.title}"? This action cannot be undone.`)) {
            return;
        }

        // Optimistically remove the task from the UI
        const originalTasks = [...allTasks];
        setAllTasks(allTasks.filter((t) => t.id !== task.id));

        // Send delete request to server
        router.delete(route("tasks.destroy", task.id), {
            preserveScroll: true,
            preserveState: true,
            only: [], // Don't reload any data
            onSuccess: () => {
                toast.success("Task deleted successfully");
            },
            onError: () => {
                // Revert to original state on error
                setAllTasks(originalTasks);
                toast.error("Failed to delete task");
            },
        });
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        const activeIndex = allTasks.findIndex(
            (task) => task.id.toString() === active.id
        );
        const overIndex = allTasks.findIndex(
            (task) => task.id.toString() === over.id
        );

        if (activeIndex === -1 || overIndex === -1) {
            return;
        }

        const activeTask = allTasks[activeIndex];
        const overTask = allTasks[overIndex];

        // Only allow reordering within the same status and priority group
        if (
            activeTask.status !== overTask.status ||
            activeTask.priority !== overTask.priority
        ) {
            return;
        }

        // Store original state for potential revert
        const originalTasks = [...allTasks];

        // Perform optimistic update
        const reorderedTasks = [...allTasks];
        const [movedTask] = reorderedTasks.splice(activeIndex, 1);
        reorderedTasks.splice(overIndex, 0, movedTask);

        setAllTasks(reorderedTasks);

        // Use the target task's current position as the new position
        const globalNewPosition = overTask.position;

        // Send the new order to the server
        router.post(
            route("tasks.reorder"),
            {
                taskId: active.id,
                newPosition: globalNewPosition,
            },
            {
                preserveScroll: true,
                preserveState: true,
                only: [], // Don't reload any data
                onSuccess: () => {
                    toast.success("Task reordered successfully");
                },
                onError: () => {
                    // Revert to original state on error
                    setAllTasks(originalTasks);
                    toast.error("Failed to reorder task");
                },
            }
        );
    };

    const handleSearch = (value) => {
        setSearch(value);
        router.get(
            route("tasks.index"),
            {
                search: value,
                status: statusFilter,
                priority: priorityFilter,
                category_id: categoryFilter,
                due_date_filter: dueDateFilter,
            },
            {
                preserveState: true,
                replace: true,
            }
        );
    };

    const handleFilter = (type, value) => {
        let newStatusFilter = statusFilter;
        let newPriorityFilter = priorityFilter;
        let newCategoryFilter = categoryFilter;
        let newDueDateFilter = dueDateFilter;

        switch (type) {
            case "status":
                newStatusFilter = value;
                break;
            case "priority":
                newPriorityFilter = value;
                break;
            case "category":
                newCategoryFilter = value;
                break;
            case "due_date":
                newDueDateFilter = value;
                break;
        }

        setStatusFilter(newStatusFilter);
        setPriorityFilter(newPriorityFilter);
        setCategoryFilter(newCategoryFilter);
        setDueDateFilter(newDueDateFilter);

        router.get(
            route("tasks.index"),
            {
                search,
                status: newStatusFilter,
                priority: newPriorityFilter,
                category_id: newCategoryFilter,
                due_date_filter: newDueDateFilter,
            },
            {
                preserveState: true,
                replace: true,
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

    const getStatusColor = (status) => {
        switch (status) {
            case "completed":
                return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20";
            case "in_progress":
                return "text-primary-400 bg-primary-100 dark:text-[#2ED7A1] dark:bg-primary-900/20";
            case "cancelled":
                return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20";
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

    const isOverdue = (dueDate, status) => {
        if (!dueDate || status === "completed") return false;
        return (
            new Date(dueDate) < new Date() &&
            new Date(dueDate).toDateString() !== new Date().toDateString()
        );
    };

    const toggleTaskStatus = (task) => {
        const newStatus = task.status === "completed" ? "pending" : "completed";

        // Update local state immediately for instant feedback
        setAllTasks(
            allTasks.map((t) =>
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
                    setAllTasks(
                        allTasks.map((t) =>
                            t.id === task.id
                                ? {
                                      ...t,
                                      status: revertStatus,
                                      completed_at:
                                          revertStatus === "completed"
                                              ? new Date().toISOString()
                                              : null,
                                  }
                                : t
                        )
                    );
                    toast.error("Failed to update task status");
                },
            }
        );
    };

    return (
        <TodoLayout
            header={
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            Tasks
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Manage and organize your tasks efficiently
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowTaskModal(true)}
                            disabled={isTaskSubmitting}
                            className="inline-flex items-center px-4 py-2 bg-primary-400 border border-transparent rounded-lg font-medium text-sm text-white hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-[#2ED7A1] dark:hover:bg-primary-400"
                            title={
                                isTaskSubmitting
                                    ? "Creating task..."
                                    : "Create a new task"
                            }
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            New Task
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Tasks" />

            <div className="space-y-6">
                {/* Search and Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex flex-col sm:flex-row gap-4">
                            {/* Search */}
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search tasks by title or description..."
                                        value={search}
                                        onChange={(e) =>
                                            handleSearch(e.target.value)
                                        }
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400 dark:bg-gray-700 dark:text-white dark:focus:ring-[#2ED7A1] dark:focus:border-[#2ED7A1] text-sm"
                                    />
                                </div>
                            </div>

                            {/* Filter Toggle */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`inline-flex items-center justify-center px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors ${
                                    showFilters || statusFilter || priorityFilter || categoryFilter || dueDateFilter
                                        ? "bg-primary-50 border-primary-200 text-primary-700 dark:bg-primary-900/20 dark:border-primary-800 dark:text-[#2ED7A1]"
                                        : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                                }`}
                            >
                                <Filter className="mr-2 h-4 w-4" />
                                Filters
                                {(statusFilter || priorityFilter || categoryFilter || dueDateFilter) && (
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-[#2ED7A1]">
                                        {[statusFilter, priorityFilter, categoryFilter, dueDateFilter].filter(Boolean).length}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Filter Options */}
                        {showFilters && (
                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Status Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Status
                                    </label>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) =>
                                            handleFilter("status", e.target.value)
                                        }
                                        className="block w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-400 focus:border-primary-400 dark:bg-gray-700 dark:text-white dark:focus:ring-[#2ED7A1] dark:focus:border-[#2ED7A1]"
                                    >
                                        <option value="">All Status</option>
                                        <option value="pending">Pending</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>

                                {/* Priority Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Priority
                                    </label>
                                    <select
                                        value={priorityFilter}
                                        onChange={(e) =>
                                            handleFilter("priority", e.target.value)
                                        }
                                        className="block w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-400 focus:border-primary-400 dark:bg-gray-700 dark:text-white dark:focus:ring-[#2ED7A1] dark:focus:border-[#2ED7A1]"
                                    >
                                        <option value="">All Priorities</option>
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>

                                {/* Category Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Category
                                    </label>
                                    <select
                                        value={categoryFilter}
                                        onChange={(e) =>
                                            handleFilter("category", e.target.value)
                                        }
                                        className="block w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-400 focus:border-primary-400 dark:bg-gray-700 dark:text-white dark:focus:ring-[#2ED7A1] dark:focus:border-[#2ED7A1]"
                                    >
                                        <option value="">All Categories</option>
                                        {categories.map((category) => (
                                            <option
                                                key={category.id}
                                                value={category.id}
                                            >
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Due Date Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Due Date
                                    </label>
                                    <select
                                        value={dueDateFilter}
                                        onChange={(e) =>
                                            handleFilter("due_date", e.target.value)
                                        }
                                        className="block w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-400 focus:border-primary-400 dark:bg-gray-700 dark:text-white dark:focus:ring-[#2ED7A1] dark:focus:border-[#2ED7A1]"
                                    >
                                        <option value="">All Dates</option>
                                        <option value="today">Today</option>
                                        <option value="tomorrow">Tomorrow</option>
                                        <option value="this_week">This Week</option>
                                        <option value="overdue">Overdue</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tasks Table */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {/* Table Header */}
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    All Tasks ({allTasks.length})
                                </h3>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    Drag to reorder • Click to view details
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Tasks List */}
                    {allTasks.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="text-gray-400 dark:text-gray-500 mb-4">
                                <CheckSquare className="mx-auto h-16 w-16" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                                No tasks found
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                                {search ||
                                statusFilter ||
                                priorityFilter ||
                                categoryFilter ||
                                dueDateFilter
                                    ? "Try adjusting your filters or search terms to find what you're looking for."
                                    : "Get started by creating your first task to organize your work and boost productivity."}
                            </p>
                            {!search &&
                                !statusFilter &&
                                !priorityFilter &&
                                !categoryFilter &&
                                !dueDateFilter && (
                                    <button
                                        onClick={() => setShowTaskModal(true)}
                                        disabled={isTaskSubmitting}
                                        className="inline-flex items-center px-4 py-2 bg-primary-400 border border-transparent rounded-lg font-medium text-sm text-white hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-[#2ED7A1] dark:hover:bg-primary-400"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create Your First Task
                                    </button>
                                )}
                        </div>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={allTasks.map((task) => task.id.toString())}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {allTasks.map((task, index) => (
                                        <SortableTask
                                            key={task.id}
                                            task={task}
                                            globalIndex={index}
                                            getPriorityColor={getPriorityColor}
                                            getStatusIcon={getStatusIcon}
                                            getStatusColor={getStatusColor}
                                            isOverdue={isOverdue}
                                            toggleTaskStatus={toggleTaskStatus}
                                            handleTaskStatusChange={handleTaskStatusChange}
                                            setSelectedTask={setSelectedTask}
                                            setShowViewModal={setShowViewModal}
                                            setShowEditModal={setShowEditModal}
                                            setShowSubtaskModal={setShowSubtaskModal}
                                            handleDeleteTask={handleDeleteTask}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    )}
                </div>
            </div>

            {/* Modals */}
            <TaskModal
                show={showTaskModal}
                onClose={() => {
                    setShowTaskModal(false);
                    setSelectedCategory(null);
                }}
                onSubmitting={setIsTaskSubmitting}
                categories={categories}
                defaultCategoryId={selectedCategory}
            />

            <TaskViewModal
                show={showViewModal}
                onClose={() => setShowViewModal(false)}
                task={selectedTask}
                onTaskUpdate={handleTaskUpdate}
            />

            <TaskEditModal
                show={showEditModal}
                onClose={() => setShowEditModal(false)}
                task={selectedTask}
                categories={categories}
                onTaskUpdate={handleTaskUpdate}
            />

            <QuickSubtaskModal
                show={showSubtaskModal}
                onClose={() => setShowSubtaskModal(false)}
                task={selectedTask}
            />

            <Toast />
        </TodoLayout>
    );
}

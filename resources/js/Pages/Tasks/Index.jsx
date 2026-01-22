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
                return <Flag className="h-3 w-3 text-amber-500" />;
            case "high":
                return <Flag className="h-3 w-3 text-orange-500" />;
            case "medium":
                return <Flag className="h-3 w-3 text-sky-500" />;
            case "low":
                return <Flag className="h-3 w-3 text-emerald-500" />;
            default:
                return <Flag className="h-3 w-3 text-slate-400" />;
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group relative bg-white dark:bg-dark-card border-b border-light-border/60 dark:border-dark-border/60 hover:bg-light-hover dark:hover:bg-dark-hover transition-colors duration-200 ${
                isDragging ? "shadow-lg z-10" : ""
            }`}
        >
            <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
                {/* Drag Handle */}
                <div className="flex w-full items-center space-x-3 min-w-0 flex-1">
                    <div
                        {...attributes}
                        {...listeners}
                        className="hidden sm:inline-flex text-light-muted hover:text-light-secondary dark:text-dark-muted dark:hover:text-dark-secondary cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Drag to reorder"
                    >
                        <GripVertical className="h-4 w-4" />
                    </div>

                    {/* Status Checkbox */}
                    <button
                        onClick={() => toggleTaskStatus(task)}
                        className="flex-shrink-0 transition-colors"
                        title={`Mark task as ${
                            task.status === "completed"
                                ? "pending"
                                : "completed"
                        }`}
                    >
                        {task.status === "completed" ? (
                            <CheckSquare className="h-5 w-5 text-emerald-500" />
                        ) : (
                            <Square className="h-5 w-5 text-slate-300 hover:text-emerald-500" />
                        )}
                    </button>


                    {/* Task Title */}
                    <div className="flex-1 min-w-0">
                        <button
                            onClick={() => {
                                setSelectedTask(task);
                                setShowViewModal(true);
                            }}
                            className={`text-left font-medium hover:text-wevie-teal dark:hover:text-wevie-mint transition-colors ${
                                task.status === "completed"
                                    ? "text-light-muted dark:text-dark-muted line-through"
                                    : "text-light-primary dark:text-dark-primary"
                            }`}
                            title={task.title}
                        >
                            {task.title.length > 100 ? `${task.title.substring(0, 100)}...` : task.title}
                        </button>
                        {task.description && (
                            <p className="text-xs text-light-muted dark:text-dark-muted truncate mt-1">
                                {task.description}
                            </p>
                        )}
                    </div>
                </div>

                {/* Category */}
                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end sm:gap-4">
                    <div className="flex items-center space-x-2 min-w-0">
                        <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{
                                backgroundColor: task.category?.color || "#6B7280",
                            }}
                        />
                        <span className="text-xs text-light-secondary dark:text-dark-secondary truncate max-w-24">
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
                            {task.status === "pending"
                                ? "Ready"
                                : task.status === "in_progress"
                                  ? "In flow"
                                  : task.status === "cancelled"
                                    ? "Paused"
                                    : "Completed"}
                        </div>
                    </div>

                    {/* Priority */}
                    <div className="flex items-center space-x-1" title={`Priority: ${task.priority}`}>
                        {getPriorityIcon(task.priority)}
                        <span className="text-xs text-light-muted dark:text-dark-muted hidden sm:inline">
                            {task.priority === "urgent"
                                ? "Focus"
                                : task.priority.charAt(0).toUpperCase() +
                                  task.priority.slice(1)}
                        </span>
                    </div>

                    {/* Due Date */}
                    {task.due_date && (
                        <div className={`flex items-center space-x-1 ${
                            isOverdue(task.due_date, task.status)
                                ? "text-amber-600 dark:text-amber-200"
                                : "text-light-muted dark:text-dark-muted"
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
                        <div className="hidden sm:flex items-center space-x-1 text-light-muted dark:text-dark-muted">
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
                        <div className="flex items-center space-x-1 text-light-muted dark:text-dark-muted">
                            <ListTodo className="h-4 w-4" />
                            <span className="text-xs">
                                {task.completed_subtasks_count || 0}/{task.subtasks_count || 0}
                            </span>
                        </div>
                    )}

                    {/* Tags */}
                    {task.tags && task.tags.length > 0 && (
                        <div className="hidden sm:flex items-center space-x-1">
                            <TagIcon className="h-4 w-4 text-light-muted dark:text-dark-muted" />
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
                    <div className="flex items-center space-x-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => {
                                setSelectedTask(task);
                                setShowSubtaskModal(true);
                            }}
                            className="p-1 text-light-muted hover:text-emerald-500 dark:text-dark-muted dark:hover:text-emerald-300 transition-colors"
                            title="Add Subtask"
                        >
                            <ListTodo className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => {
                                setSelectedTask(task);
                                setShowViewModal(true);
                            }}
                            className="p-1 text-light-muted hover:text-wevie-teal dark:text-dark-muted dark:hover:text-wevie-mint transition-colors"
                            title="View Task"
                        >
                            <Eye className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => {
                                setSelectedTask(task);
                                setShowEditModal(true);
                            }}
                            className="p-1 text-light-muted hover:text-wevie-teal dark:text-dark-muted dark:hover:text-wevie-mint transition-colors"
                            title="Edit Task"
                        >
                            <Edit className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => handleDeleteTask(task)}
                            className="p-1 text-light-muted hover:text-rose-500 dark:text-dark-muted dark:hover:text-rose-300 transition-colors"
                            title="Remove Task"
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
                    toast.success("Status updated gently.");
                },
                onError: () => {
                    // Revert the optimistic update on error
                    setAllTasks(
                        allTasks.map((t) =>
                            t.id === task.id ? task : t
                        )
                    );
                    toast.error(
                        "We couldn’t update that just now. Try again when you’re ready."
                    );
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
        if (
            !confirm(
                `Remove "${task.title}"? You can add it again anytime.`
            )
        ) {
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
                toast.success("Task removed. It’s here if you need it again.");
            },
            onError: () => {
                // Revert to original state on error
                setAllTasks(originalTasks);
                toast.error(
                    "We couldn’t remove that just now. Please try again."
                );
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

        window.axios
            .post(
                route("tasks.reorder"),
                {
                    taskIds: reorderedTasks.map((task) => task.id),
                },
                {
                    headers: {
                        Accept: "application/json",
                    },
                }
            )
            .then(() => {
                toast.success("Task reordered successfully");
            })
            .catch(() => {
                // Revert to original state on error
                setAllTasks(originalTasks);
                toast.error(
                    "We couldn’t reorder that just now. Please try again."
                );
            });
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

    const getStatusColor = (status) => {
        switch (status) {
            case "completed":
                return "text-emerald-700 bg-emerald-100/70 dark:text-emerald-200 dark:bg-emerald-900/20";
            case "in_progress":
                return "text-sky-700 bg-sky-100/70 dark:text-sky-200 dark:bg-sky-900/20";
            case "cancelled":
                return "text-slate-600 bg-slate-100/70 dark:text-slate-300 dark:bg-slate-800/40";
            default:
                return "text-amber-700 bg-amber-100/70 dark:text-amber-200 dark:bg-amber-900/20";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "completed":
                return <CheckCircle className="h-5 w-5 text-emerald-500" />;
            case "in_progress":
                return <Clock className="h-5 w-5 text-sky-500" />;
            case "cancelled":
                return <AlertTriangle className="h-5 w-5 text-slate-400" />;
            default:
                return <Circle className="h-5 w-5 text-amber-500" />;
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
                            ? "Nice work. Task set to done."
                            : "Task is back on your list."
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
                    toast.error(
                        "We couldn’t update that just now. Try again when you’re ready."
                    );
                },
            }
        );
    };

    return (
        <TodoLayout
            header={
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-semibold text-light-primary dark:text-dark-primary">
                            Tasks
                        </h1>
                        <p className="text-sm text-light-muted dark:text-dark-muted mt-1">
                            A calm space to keep track of what matters.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowTaskModal(true)}
                            disabled={isTaskSubmitting}
                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-wevie-teal to-wevie-mint border border-transparent rounded-xl font-medium text-sm text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wevie-teal/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={
                                isTaskSubmitting
                                    ? "Saving your task..."
                                    : "Create a new task"
                            }
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            New task
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Tasks" />

            <div className="space-y-6">
                {/* Search and Filters */}
                <div className="card">
                    <div className="p-4 border-b border-light-border/70 dark:border-dark-border/70">
                        <div className="flex flex-col sm:flex-row gap-4">
                            {/* Search */}
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-light-muted dark:text-dark-muted" />
                                    <input
                                        type="text"
                                        placeholder="Search by title or notes..."
                                        value={search}
                                        onChange={(e) =>
                                            handleSearch(e.target.value)
                                        }
                                        className="w-full pl-10 pr-4 py-2.5 border border-light-border/70 dark:border-dark-border/70 rounded-xl focus:ring-2 focus:ring-wevie-teal/40 focus:border-wevie-teal dark:bg-dark-card dark:text-dark-primary text-sm"
                                    />
                                </div>
                            </div>

                            {/* Filter Toggle */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`inline-flex items-center justify-center px-4 py-2.5 border rounded-xl text-sm font-medium transition-colors ${
                                    showFilters || statusFilter || priorityFilter || categoryFilter || dueDateFilter
                                        ? "bg-wevie-teal/10 border-wevie-teal/30 text-wevie-text-primary dark:bg-wevie-teal/10 dark:border-wevie-teal/30 dark:text-wevie-dark-text-primary"
                                        : "bg-white dark:bg-dark-card border-light-border/70 dark:border-dark-border/70 text-light-secondary dark:text-dark-secondary hover:bg-light-hover dark:hover:bg-dark-hover"
                                }`}
                            >
                                <Filter className="mr-2 h-4 w-4" />
                                Filters
                                {(statusFilter || priorityFilter || categoryFilter || dueDateFilter) && (
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-wevie-teal/20 text-wevie-text-primary dark:bg-wevie-teal/20 dark:text-wevie-dark-text-primary">
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
                                    <label className="block text-sm font-medium text-light-secondary dark:text-dark-secondary mb-2">
                                        Status
                                    </label>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) =>
                                            handleFilter("status", e.target.value)
                                        }
                                        className="block w-full border border-light-border/70 dark:border-dark-border/70 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-wevie-teal/40 focus:border-wevie-teal dark:bg-dark-card dark:text-dark-primary"
                                    >
                                        <option value="">All statuses</option>
                                        <option value="pending">Ready</option>
                                        <option value="in_progress">In flow</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Paused</option>
                                    </select>
                                </div>

                                {/* Priority Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-light-secondary dark:text-dark-secondary mb-2">
                                        Priority
                                    </label>
                                    <select
                                        value={priorityFilter}
                                        onChange={(e) =>
                                            handleFilter("priority", e.target.value)
                                        }
                                        className="block w-full border border-light-border/70 dark:border-dark-border/70 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-wevie-teal/40 focus:border-wevie-teal dark:bg-dark-card dark:text-dark-primary"
                                    >
                                        <option value="">All priorities</option>
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Focus</option>
                                    </select>
                                </div>

                                {/* Category Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-light-secondary dark:text-dark-secondary mb-2">
                                        Category
                                    </label>
                                    <select
                                        value={categoryFilter}
                                        onChange={(e) =>
                                            handleFilter("category", e.target.value)
                                        }
                                        className="block w-full border border-light-border/70 dark:border-dark-border/70 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-wevie-teal/40 focus:border-wevie-teal dark:bg-dark-card dark:text-dark-primary"
                                    >
                                        <option value="">All categories</option>
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
                                    <label className="block text-sm font-medium text-light-secondary dark:text-dark-secondary mb-2">
                                        Due date
                                    </label>
                                    <select
                                        value={dueDateFilter}
                                        onChange={(e) =>
                                            handleFilter("due_date", e.target.value)
                                        }
                                        className="block w-full border border-light-border/70 dark:border-dark-border/70 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-wevie-teal/40 focus:border-wevie-teal dark:bg-dark-card dark:text-dark-primary"
                                    >
                                        <option value="">All dates</option>
                                        <option value="today">Today</option>
                                        <option value="tomorrow">Tomorrow</option>
                                        <option value="this_week">This week</option>
                                        <option value="overdue">Needs attention</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tasks Table */}
                <div className="card overflow-hidden">
                    {/* Table Header */}
                    <div className="px-4 py-3 border-b border-light-border/70 dark:border-dark-border/70 bg-light-hover dark:bg-dark-hover">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <h3 className="text-sm font-medium text-light-secondary dark:text-dark-secondary">
                                    All Tasks ({allTasks.length})
                                </h3>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-xs text-light-muted dark:text-dark-muted">
                                    Drag to reorder • Tap a task to see details
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Tasks List */}
                    {allTasks.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="text-light-muted dark:text-dark-muted mb-4">
                                <CheckSquare className="mx-auto h-16 w-16" />
                            </div>
                            <h3 className="text-lg font-medium text-light-primary dark:text-dark-primary mb-2">
                                Nothing here yet
                            </h3>
                            <p className="text-light-muted dark:text-dark-muted mb-6 max-w-md mx-auto">
                                {search ||
                                statusFilter ||
                                priorityFilter ||
                                categoryFilter ||
                                dueDateFilter
                                    ? "Try a softer filter or a shorter search."
                                    : "Start with one small task when you’re ready."}
                            </p>
                            {!search &&
                                !statusFilter &&
                                !priorityFilter &&
                                !categoryFilter &&
                                !dueDateFilter && (
                                    <button
                                        onClick={() => setShowTaskModal(true)}
                                        disabled={isTaskSubmitting}
                                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-wevie-teal to-wevie-mint border border-transparent rounded-xl font-medium text-sm text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wevie-teal/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create your first task
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

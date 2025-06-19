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
    isOverdue,
    toggleTaskStatus,
    setSelectedTask,
    setShowViewModal,
    setShowEditModal,
    setShowSubtaskModal,
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

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`p-4 sm:p-6 transition-colors duration-150 ${
                isDragging
                    ? "bg-gray-50 dark:bg-gray-700"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {/* Drag Handle */}
                    <div
                        {...attributes}
                        {...listeners}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing"
                    >
                        <GripVertical className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>

                    {/* Status Icon */}
                    <button
                        onClick={() => toggleTaskStatus(task)}
                        className="flex-shrink-0 hover:scale-110 transition-transform"
                    >
                        {getStatusIcon(task.status)}
                    </button>

                    {/* Task Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center">
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-row items-center gap-2">
                                    <h3
                                        className={`text-sm sm:text-base font-medium truncate ${
                                            task.status === "completed"
                                                ? "text-gray-500 dark:text-gray-400 line-through"
                                                : "text-gray-900 dark:text-gray-100"
                                        }`}
                                    >
                                        {task.title}
                                    </h3>
                                    {/* Priority Badge */}
                                    <span
                                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                                            task.priority
                                        )}`}
                                    >
                                        {task.priority.charAt(0).toUpperCase() +
                                            task.priority.slice(1)}
                                    </span>

                                    {/* Tags */}
                                    {task.tags && task.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {task.tags.map((tag) => (
                                                <span
                                                    key={tag.id}
                                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                                                    style={{
                                                        backgroundColor:
                                                            tag.color,
                                                    }}
                                                >
                                                    {tag.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {task.description && (
                                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                                        {task.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Task Meta Info */}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                            {/* Due Date and Time */}
                            {task.due_date && (
                                <div
                                    className={`flex items-center space-x-1 ${
                                        isOverdue(task.due_date)
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
                                                        const formatTime = (
                                                            timeStr
                                                        ) => {
                                                            if (!timeStr)
                                                                return "";
                                                            // Handle both time formats (HH:MM and full datetime)
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
                                                                parseInt(hours);
                                                            const ampm =
                                                                hour >= 12
                                                                    ? "PM"
                                                                    : "AM";
                                                            const displayHour =
                                                                hour % 12 || 12;
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
                                                        } else if (startTime) {
                                                            return `From ${startTime}`;
                                                        } else if (endTime) {
                                                            return `Until ${endTime}`;
                                                        }
                                                        return "";
                                                    })()}
                                                </span>
                                            )}
                                        {task.is_all_day && (
                                            <span className="ml-1 text-gray-400">
                                                (All day)
                                            </span>
                                        )}
                                    </span>
                                </div>
                            )}

                            {/* Subtasks count */}
                            {task.subtasks_count > 0 && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {task.completed_subtasks_count}/
                                    {task.subtasks_count} subtasks
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-1 sm:space-x-2 ml-2">
                    <button
                        onClick={() => {
                            setSelectedTask(task);
                            setShowSubtaskModal(true);
                        }}
                        className="p-1 sm:p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                        title="Add Subtask"
                    >
                        <ListTodo className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => {
                            setSelectedTask(task);
                            setShowViewModal(true);
                        }}
                        className="p-1 sm:p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="View Task"
                    >
                        <Eye className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => {
                            setSelectedTask(task);
                            setShowEditModal(true);
                        }}
                        className="p-1 sm:p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="Edit Task"
                    >
                        <Edit className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Index({ categorizedTasks, categories, filters }) {
    const [categorizedTaskList, setCategorizedTaskList] = useState(
        categorizedTasks || []
    );
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
    const [isTaskSubmitting, setIsTaskSubmitting] = useState(false);

    // Handle task updates from modals
    const handleTaskUpdate = (updatedTask) => {
        setSelectedTask(updatedTask);
        // Also update the task in the categorized task list
        setCategorizedTaskList(
            categorizedTaskList.map((group) => ({
                ...group,
                tasks: {
                    ...group.tasks,
                    data: group.tasks.data.map((t) =>
                        t.id === updatedTask.id ? updatedTask : t
                    ),
                },
            }))
        );
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        setCategorizedTaskList(categorizedTasks || []);
    }, [categorizedTasks]);

    // Get all tasks from all categories for operations that need the full list
    const getAllTasks = () => {
        return categorizedTaskList.flatMap((group) => group.tasks.data || []);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        // Find which category contains both the dragged task and target
        let sourceGroup = null;
        let sourceTaskIndex = -1;
        let targetTaskIndex = -1;
        let targetGroup = null;

        for (const group of categorizedTaskList) {
            const activeIndex = group.tasks.data.findIndex(
                (task) => task.id.toString() === active.id
            );
            const overIndex = group.tasks.data.findIndex(
                (task) => task.id.toString() === over.id
            );

            if (activeIndex !== -1) {
                sourceGroup = group;
                sourceTaskIndex = activeIndex;
            }
            if (overIndex !== -1) {
                targetGroup = group;
                targetTaskIndex = overIndex;
            }
        }

        // Only allow reordering within the same category
        if (
            !sourceGroup ||
            !targetGroup ||
            sourceGroup !== targetGroup ||
            sourceTaskIndex === -1 ||
            targetTaskIndex === -1
        ) {
            return;
        }

        // Store original state for potential revert
        const originalCategorizedTaskList = [...categorizedTaskList];

        // Perform optimistic update within the same category
        const updatedCategorizedTaskList = categorizedTaskList.map((group) => {
            if (group === sourceGroup) {
                const reorderedTasks = [...group.tasks.data];
                const [movedTask] = reorderedTasks.splice(sourceTaskIndex, 1);
                reorderedTasks.splice(targetTaskIndex, 0, movedTask);

                return {
                    ...group,
                    tasks: {
                        ...group.tasks,
                        data: reorderedTasks,
                    },
                };
            }
            return group;
        });

        setCategorizedTaskList(updatedCategorizedTaskList);

        // Get the actual tasks being moved
        const sourceTask = sourceGroup.tasks.data[sourceTaskIndex];
        const targetTask = sourceGroup.tasks.data[targetTaskIndex];

        // Use the target task's current position as the new position
        const globalNewPosition = targetTask.position;

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
                    setCategorizedTaskList(originalCategorizedTaskList);
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

    const isOverdue = (dueDate) => {
        if (!dueDate) return false;
        return (
            new Date(dueDate) < new Date() &&
            new Date(dueDate).toDateString() !== new Date().toDateString()
        );
    };

    const toggleTaskStatus = (task) => {
        const newStatus = task.status === "completed" ? "pending" : "completed";

        // Update local state immediately for instant feedback
        setCategorizedTaskList(
            categorizedTaskList.map((group) => ({
                ...group,
                tasks: {
                    ...group.tasks,
                    data: group.tasks.data.map((t) =>
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
                    ),
                },
            }))
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
                    setCategorizedTaskList(
                        categorizedTaskList.map((group) => ({
                            ...group,
                            tasks: {
                                ...group.tasks,
                                data: group.tasks.data.map((t) =>
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
                                ),
                            },
                        }))
                    );
                    toast.error("Failed to update task status");
                },
            }
        );
    };

    return (
        <TodoLayout
            header={
                <div className="flex flex-row items-center justify-between gap-2 md:gap-4">
                    <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100 flex-shrink-0">
                        My Tasks
                    </h2>
                    <button
                        onClick={() => setShowTaskModal(true)}
                        disabled={isTaskSubmitting}
                        className="inline-flex items-center justify-center w-auto px-3 py-2 sm:px-2 sm:py-1.5 md:px-4 md:py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs sm:text-xs md:text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus className="mr-1 sm:mr-2 h-4 w-4 sm:h-3 sm:w-3 md:h-4 md:w-4" />
                        <span className="hidden sm:inline">New Task</span>
                        <span className="sm:hidden">Add</span>
                    </button>
                </div>
            }
        >
            <Head title="Tasks" />

            <div className="space-y-4 sm:space-y-6">
                {/* Search and Filters */}
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search tasks..."
                                    value={search}
                                    onChange={(e) =>
                                        handleSearch(e.target.value)
                                    }
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base"
                                />
                            </div>
                        </div>

                        {/* Filter Toggle */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <Filter className="mr-2 h-4 w-4" />
                            Filters
                        </button>
                    </div>

                    {/* Filter Options */}
                    {showFilters && (
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            {/* Status Filter */}
                            <select
                                value={statusFilter}
                                onChange={(e) =>
                                    handleFilter("status", e.target.value)
                                }
                                className="block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>

                            {/* Priority Filter */}
                            <select
                                value={priorityFilter}
                                onChange={(e) =>
                                    handleFilter("priority", e.target.value)
                                }
                                className="block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="">All Priorities</option>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>

                            {/* Category Filter */}
                            <select
                                value={categoryFilter}
                                onChange={(e) =>
                                    handleFilter("category", e.target.value)
                                }
                                className="block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
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

                            {/* Due Date Filter */}
                            <select
                                value={dueDateFilter}
                                onChange={(e) =>
                                    handleFilter("due_date", e.target.value)
                                }
                                className="block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="">All Dates</option>
                                <option value="today">Today</option>
                                <option value="tomorrow">Tomorrow</option>
                                <option value="this_week">This Week</option>
                                <option value="overdue">Overdue</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* Tasks List */}
                <div className="space-y-6">
                    {categorizedTaskList.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 sm:p-8 text-center">
                            <div className="text-gray-400 dark:text-gray-500 mb-4">
                                <CheckCircle className="mx-auto h-10 w-10 sm:h-12 sm:w-12" />
                            </div>
                            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                                No tasks found
                            </h3>
                            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4">
                                {search ||
                                statusFilter ||
                                priorityFilter ||
                                categoryFilter ||
                                dueDateFilter
                                    ? "Try adjusting your filters or search terms."
                                    : "Get started by creating your first task."}
                            </p>
                            {!search &&
                                !statusFilter &&
                                !priorityFilter &&
                                !categoryFilter &&
                                !dueDateFilter && (
                                    <button
                                        onClick={() => setShowTaskModal(true)}
                                        disabled={isTaskSubmitting}
                                        className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create Task
                                    </button>
                                )}
                        </div>
                    ) : (
                        categorizedTaskList.map((group, groupIndex) => (
                            <div
                                key={group.category.id || "uncategorized"}
                                className="bg-white dark:bg-gray-800 shadow-sm rounded-lg"
                            >
                                {/* Category Header */}
                                <div className="px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center space-x-3">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{
                                                backgroundColor:
                                                    group.category.color,
                                            }}
                                        />
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                            {group.category.name}
                                        </h3>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                                            {group.tasks.total}{" "}
                                            {group.tasks.total === 1
                                                ? "task"
                                                : "tasks"}
                                        </span>
                                    </div>
                                </div>

                                {/* Tasks in Category */}
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={group.tasks.data.map((task) =>
                                            task.id.toString()
                                        )}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {group.tasks.data.map(
                                                (task, index) => {
                                                    const globalIndex =
                                                        getAllTasks().findIndex(
                                                            (t) =>
                                                                t.id === task.id
                                                        );
                                                    return (
                                                        <SortableTask
                                                            key={task.id}
                                                            task={task}
                                                            globalIndex={
                                                                globalIndex
                                                            }
                                                            getPriorityColor={
                                                                getPriorityColor
                                                            }
                                                            getStatusIcon={
                                                                getStatusIcon
                                                            }
                                                            isOverdue={
                                                                isOverdue
                                                            }
                                                            toggleTaskStatus={
                                                                toggleTaskStatus
                                                            }
                                                            setSelectedTask={
                                                                setSelectedTask
                                                            }
                                                            setShowViewModal={
                                                                setShowViewModal
                                                            }
                                                            setShowEditModal={
                                                                setShowEditModal
                                                            }
                                                            setShowSubtaskModal={
                                                                setShowSubtaskModal
                                                            }
                                                        />
                                                    );
                                                }
                                            )}
                                        </div>
                                    </SortableContext>
                                </DndContext>

                                {/* Category Pagination */}
                                {group.tasks.links &&
                                    group.tasks.links.length > 3 && (
                                        <div className="px-4 sm:px-6 py-3 border-t border-gray-200 dark:border-gray-700">
                                            <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
                                                {group.tasks.links.map(
                                                    (link, index) => (
                                                        <Link
                                                            key={index}
                                                            href={
                                                                link.url || "#"
                                                            }
                                                            className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                                                                link.active
                                                                    ? "bg-blue-600 text-white"
                                                                    : link.url
                                                                    ? "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                                    : "text-gray-400 dark:text-gray-500 cursor-not-allowed"
                                                            }`}
                                                            dangerouslySetInnerHTML={{
                                                                __html: link.label,
                                                            }}
                                                        />
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modals */}
            <TaskModal
                show={showTaskModal}
                onClose={() => setShowTaskModal(false)}
                onSubmitting={setIsTaskSubmitting}
                categories={categories}
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

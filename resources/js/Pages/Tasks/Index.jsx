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
    handleTaskStatusChange,
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
                        title="Drag to reorder task within same priority group"
                    >
                        <GripVertical className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>

                    {/* Status Icon */}
                    <button
                        onClick={() => toggleTaskStatus(task)}
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
                                            setSelectedTask(task);
                                            setShowViewModal(true);
                                        }}
                                        className={`text-sm sm:text-base font-medium truncate text-left hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 cursor-pointer underline-offset-2 hover:underline hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded px-1 py-0.5 -mx-1 -my-0.5 ${
                                            task.status === "completed"
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
                                    <button
                                        onClick={() => {
                                            setSelectedTask(task);
                                            setShowViewModal(true);
                                        }}
                                        className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 truncate text-left hover:text-blue-500 dark:hover:text-blue-400 transition-all duration-200 cursor-pointer underline-offset-2 hover:underline w-full hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded px-1 py-0.5 -mx-1 -my-0.5"
                                        title="Click to view task details"
                                    >
                                        {task.description}
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
                            <div className="flex items-center space-x-1">
                                <ListTodo className="h-3 w-3 text-gray-400" />
                                <span
                                    className={`text-xs font-medium ${
                                        task.subtasks_count > 0
                                            ? "text-blue-600 dark:text-blue-400"
                                            : "text-gray-500 dark:text-gray-400"
                                    }`}
                                >
                                    {task.completed_subtasks_count || 0}/
                                    {task.subtasks_count || 0}
                                </span>
                                <span className="text-xs text-gray-400">
                                    subtasks
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-1 sm:space-x-2 ml-2">
                    {/* Status Dropdown - Hidden on mobile */}
                    <div className="relative hidden sm:block">
                        <select
                            value={task.status}
                            onChange={(e) =>
                                handleTaskStatusChange(task, e.target.value)
                            }
                            className="text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md pl-2 pr-6 py-1 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer min-w-[85px]"
                            style={{
                                appearance: "none",
                                WebkitAppearance: "none",
                                MozAppearance: "none",
                                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                backgroundPosition: "right 0.5rem center",
                                backgroundRepeat: "no-repeat",
                                backgroundSize: "1rem 1rem",
                            }}
                            title="Change task status"
                        >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

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
    const [hideCompleted, setHideCompleted] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showSubtaskModal, setShowSubtaskModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [isTaskSubmitting, setIsTaskSubmitting] = useState(false);

    // Category collapse states - initialize all categories as expanded
    const [collapsedCategories, setCollapsedCategories] = useState(new Set());

    // Toggle category collapse state
    const toggleCategoryCollapse = (categoryId) => {
        setCollapsedCategories((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(categoryId)) {
                newSet.delete(categoryId);
            } else {
                newSet.add(categoryId);
            }
            return newSet;
        });
    };

    // Handle quick add task for specific category
    const handleQuickAddTask = (categoryId, event) => {
        event.stopPropagation(); // Prevent category toggle when clicking the + button
        setSelectedCategory(categoryId);
        setShowTaskModal(true);
    };

    // Handle task status change
    const handleTaskStatusChange = (task, newStatus) => {
        // Optimistically update the task status in the UI
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
                    setCategorizedTaskList(
                        categorizedTaskList.map((group) => ({
                            ...group,
                            tasks: {
                                ...group.tasks,
                                data: group.tasks.data.map((t) =>
                                    t.id === task.id ? task : t
                                ),
                            },
                        }))
                    );
                    toast.error("Failed to update task status");
                },
            }
        );
    };

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

    // Filter tasks based on hideCompleted setting
    const filteredCategorizedTaskList = categorizedTaskList.map((group) => ({
        ...group,
        tasks: {
            ...group.tasks,
            data: hideCompleted
                ? group.tasks.data.filter((task) => task.status !== "completed")
                : group.tasks.data,
            total: hideCompleted
                ? group.tasks.data.filter((task) => task.status !== "completed")
                      .length
                : group.tasks.total,
        },
    }));

    useEffect(() => {
        setCategorizedTaskList(categorizedTasks || []);

        // Auto-expand categories that contain tasks when search results change
        if (search && categorizedTasks && categorizedTasks.length > 0) {
            const categoriesToExpand = new Set();

            categorizedTasks.forEach((group) => {
                if (group.tasks.data && group.tasks.data.length > 0) {
                    categoriesToExpand.add(
                        group.category.id || "uncategorized"
                    );
                }
            });

            // Update collapsed categories to exclude categories with search results
            setCollapsedCategories((prev) => {
                const newSet = new Set(prev);
                categoriesToExpand.forEach((categoryId) => {
                    newSet.delete(categoryId);
                });
                return newSet;
            });
        }
    }, [categorizedTasks, search]);

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

        // Get the actual tasks being moved
        const sourceTask = sourceGroup?.tasks.data[sourceTaskIndex];
        const targetTask = targetGroup?.tasks.data[targetTaskIndex];

        // Only allow reordering within the same category, status, and priority group
        // to maintain the new sorting logic (active tasks first, then by priority)
        if (
            !sourceGroup ||
            !targetGroup ||
            sourceGroup !== targetGroup ||
            sourceTaskIndex === -1 ||
            targetTaskIndex === -1 ||
            !sourceTask ||
            !targetTask ||
            sourceTask.status !== targetTask.status ||
            sourceTask.priority !== targetTask.priority
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
                    <div className="flex items-center gap-2">
                        {/* Hide Completed Toggle */}
                        <button
                            onClick={() => setHideCompleted(!hideCompleted)}
                            className={`inline-flex items-center justify-center px-2 py-1 sm:px-3 sm:py-1.5 rounded-md font-medium text-xs transition-all duration-300 border-2 transform hover:scale-105 active:scale-95 ${
                                hideCompleted
                                    ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-600 shadow-md hover:bg-orange-200 dark:hover:bg-orange-900/50 hover:shadow-lg ring-2 ring-orange-200 dark:ring-orange-800"
                                    : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-600 shadow-sm hover:bg-green-200 dark:hover:bg-green-900/50 hover:shadow-md ring-2 ring-green-200 dark:ring-green-800"
                            }`}
                            title={
                                hideCompleted
                                    ? "🔶 ACTIVE: Hiding completed tasks - Click to show them"
                                    : "🟢 ACTIVE: Showing completed tasks - Click to hide them"
                            }
                        >
                            {hideCompleted ? (
                                <>
                                    <Eye className="mr-1 h-3 w-3" />
                                    <span className="hidden sm:inline">
                                        Show Completed
                                    </span>
                                    <span className="sm:hidden">Show</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="mr-1 h-3 w-3" />
                                    <span className="hidden sm:inline">
                                        Hide Completed
                                    </span>
                                    <span className="sm:hidden">Hide</span>
                                </>
                            )}
                            {/* Active indicator dot */}
                            <div
                                className={`ml-1 w-2 h-2 rounded-full transition-colors ${
                                    hideCompleted
                                        ? "bg-orange-500 dark:bg-orange-400"
                                        : "bg-green-500 dark:bg-green-400"
                                }`}
                            />
                        </button>

                        <button
                            onClick={() => setShowTaskModal(true)}
                            disabled={isTaskSubmitting}
                            className="inline-flex items-center justify-center w-auto px-3 py-2 sm:px-2 sm:py-1.5 md:px-4 md:py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs sm:text-xs md:text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={
                                isTaskSubmitting
                                    ? "Creating task..."
                                    : "Create a new task"
                            }
                        >
                            <Plus className="mr-1 sm:mr-2 h-4 w-4 sm:h-3 sm:w-3 md:h-4 md:w-4" />
                            <span className="hidden sm:inline">New Task</span>
                            <span className="sm:hidden">Add</span>
                        </button>
                    </div>
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
                    {filteredCategorizedTaskList.filter((group) => {
                        // Show empty categories unless there are active filters (search, status, priority, category, due date)
                        // but always show categories when just hiding completed tasks
                        const hasActiveFilters =
                            search ||
                            statusFilter ||
                            priorityFilter ||
                            categoryFilter ||
                            dueDateFilter;
                        return hasActiveFilters
                            ? group.tasks.data.length > 0
                            : true;
                    }).length === 0 ? (
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
                                    : hideCompleted
                                    ? "All tasks are completed! Toggle 'Show Completed' to see them, or create a new task."
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
                        filteredCategorizedTaskList
                            .filter((group) => {
                                // Show empty categories unless there are active filters (search, status, priority, category, due date)
                                // but always show categories when just hiding completed tasks
                                const hasActiveFilters =
                                    search ||
                                    statusFilter ||
                                    priorityFilter ||
                                    categoryFilter ||
                                    dueDateFilter;
                                return hasActiveFilters
                                    ? group.tasks.data.length > 0
                                    : true;
                            })
                            .map((group, groupIndex) => (
                                <div
                                    key={group.category.id || "uncategorized"}
                                    className="bg-white dark:bg-gray-800 shadow-sm rounded-lg"
                                >
                                    {/* Category Header */}
                                    <div className="px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center space-x-3">
                                            <button
                                                onClick={() =>
                                                    toggleCategoryCollapse(
                                                        group.category.id ||
                                                            "uncategorized"
                                                    )
                                                }
                                                className="flex items-center space-x-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md p-2 -m-2 transition-colors flex-1"
                                                title={`${
                                                    collapsedCategories.has(
                                                        group.category.id ||
                                                            "uncategorized"
                                                    )
                                                        ? "Expand"
                                                        : "Collapse"
                                                } ${
                                                    group.category.name
                                                } category`}
                                            >
                                                <div className="flex-shrink-0">
                                                    {collapsedCategories.has(
                                                        group.category.id ||
                                                            "uncategorized"
                                                    ) ? (
                                                        <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                                    ) : (
                                                        <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                                    )}
                                                </div>
                                                <div
                                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                                    style={{
                                                        backgroundColor:
                                                            group.category
                                                                .color,
                                                    }}
                                                />
                                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex-1">
                                                    {group.category.name}
                                                </h3>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 flex-shrink-0">
                                                    {group.tasks.data.length}{" "}
                                                    {group.tasks.data.length ===
                                                    1
                                                        ? "task"
                                                        : "tasks"}
                                                </span>
                                            </button>

                                            {/* Quick Add Task Button */}
                                            <button
                                                onClick={(e) =>
                                                    handleQuickAddTask(
                                                        group.category.id ||
                                                            null,
                                                        e
                                                    )
                                                }
                                                className="flex-shrink-0 p-2 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-200 hover:scale-110 shadow-sm hover:shadow-md"
                                                title={`Add task to ${group.category.name}`}
                                            >
                                                <Plus className="h-4 w-4 font-bold" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Tasks in Category */}
                                    {!collapsedCategories.has(
                                        group.category.id || "uncategorized"
                                    ) && (
                                        <>
                                            {group.tasks.data.length > 0 ? (
                                                <DndContext
                                                    sensors={sensors}
                                                    collisionDetection={
                                                        closestCenter
                                                    }
                                                    onDragEnd={handleDragEnd}
                                                >
                                                    <SortableContext
                                                        items={group.tasks.data.map(
                                                            (task) =>
                                                                task.id.toString()
                                                        )}
                                                        strategy={
                                                            verticalListSortingStrategy
                                                        }
                                                    >
                                                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                                            {group.tasks.data.map(
                                                                (
                                                                    task,
                                                                    index
                                                                ) => {
                                                                    const globalIndex =
                                                                        getAllTasks().findIndex(
                                                                            (
                                                                                t
                                                                            ) =>
                                                                                t.id ===
                                                                                task.id
                                                                        );
                                                                    return (
                                                                        <SortableTask
                                                                            key={
                                                                                task.id
                                                                            }
                                                                            task={
                                                                                task
                                                                            }
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
                                                                            handleTaskStatusChange={
                                                                                handleTaskStatusChange
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
                                            ) : (
                                                <div className="p-6 sm:p-8 text-center">
                                                    <div className="text-gray-400 dark:text-gray-500 mb-3">
                                                        <ListTodo className="mx-auto h-8 w-8" />
                                                    </div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        No tasks in this
                                                        category yet.
                                                    </p>
                                                </div>
                                            )}

                                            {/* Category Pagination */}
                                            {group.tasks.data.length > 0 &&
                                                group.tasks.links &&
                                                group.tasks.links.length >
                                                    3 && (
                                                    <div className="px-4 sm:px-6 py-3 border-t border-gray-200 dark:border-gray-700">
                                                        <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
                                                            {group.tasks.links.map(
                                                                (
                                                                    link,
                                                                    index
                                                                ) => (
                                                                    <Link
                                                                        key={
                                                                            index
                                                                        }
                                                                        href={
                                                                            link.url ||
                                                                            "#"
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
                                        </>
                                    )}
                                </div>
                            ))
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

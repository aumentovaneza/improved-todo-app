import TodoLayout from "@/Layouts/TodoLayout";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { Head, router } from "@inertiajs/react";
import { useState, useEffect, useMemo } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
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
    Edit,
    Trash2,
    GripVertical,
    Eye,
    ListTodo,
    ChevronDown,
    ChevronRight,
    CalendarDays,
    Clock3,
    Flag,
    CheckSquare,
    Square,
    List,
    X,
} from "lucide-react";
import TaskModal from "@/Components/TaskModal";
import TaskViewModal from "@/Components/TaskViewModal";
import TaskEditModal from "@/Components/TaskEditModal";
import { TASK_STATUS_OPTIONS } from "@/Components/TaskStatusSelect";
import TaskActionsMenu from "@/Components/TaskActionsMenu";
import QuickSubtaskModal from "@/Components/QuickSubtaskModal";
import Toast from "@/Components/Toast";
import OnboardingTour from "@/Components/OnboardingTour";
import { tasksSteps } from "@/tours";
import { toast } from "react-toastify";

const PRIORITY_GROUP_ORDER = ["urgent", "high", "medium", "low"];
const PRIORITY_GROUP_LABELS = {
    urgent: "Focus",
    high: "High",
    medium: "Medium",
    low: "Low",
};
const PRIORITY_GROUP_COLORS = {
    urgent: "#F59E0B",
    high: "#F97316",
    medium: "#0EA5E9",
    low: "#10B981",
};

const taskDateValue = (value) =>
    value ? new Date(`${String(value).slice(0, 10)}T12:00:00`) : null;

function SortableTask({
    task,
    isOverdue,
    toggleTaskStatus,
    setSelectedTask,
    setShowViewModal,
    setShowEditModal,
    setShowSubtaskModal,
    handleDeleteTask,
    reorderable,
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: task.id.toString(),
        disabled: !reorderable,
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

    const actionItems = [
        {
            label: "Add subtask",
            icon: ListTodo,
            onClick: () => {
                setSelectedTask(task);
                setShowSubtaskModal(true);
            },
        },
        {
            label: "View",
            icon: Eye,
            onClick: () => {
                setSelectedTask(task);
                setShowViewModal(true);
            },
        },
        {
            label: "Edit",
            icon: Edit,
            onClick: () => {
                setSelectedTask(task);
                setShowEditModal(true);
            },
        },
        ...(task.lists && task.lists.length > 0
            ? [
                  {
                      label: "Open list",
                      icon: List,
                      onClick: () => router.visit(route("lists.show", task.lists[0].id)),
                  },
              ]
            : []),
        {
            label: "Delete",
            icon: Trash2,
            danger: true,
            onClick: () => handleDeleteTask(task),
        },
    ];

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
                    {reorderable && (
                        <div
                            {...attributes}
                            {...listeners}
                            className="hidden sm:inline-flex text-light-muted hover:text-light-secondary dark:text-dark-muted dark:hover:text-dark-secondary cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Drag to reorder"
                        >
                            <GripVertical className="h-4 w-4" />
                        </div>
                    )}

                    {/* Status Checkbox */}
                    <button
                        onClick={() => toggleTaskStatus(task)}
                        className="flex-shrink-0 transition-colors"
                        title={`Mark task as ${
                            task.status === "completed" ? "pending" : "completed"
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
                            {task.title.length > 100
                                ? `${task.title.substring(0, 100)}...`
                                : task.title}
                        </button>
                    </div>

                    {/* Actions (mobile: pinned to the title row so it never wraps) */}
                    <div className="flex-shrink-0 sm:hidden">
                        <TaskActionsMenu items={actionItems} />
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
                            title={task.category?.name || "Uncategorized"}
                        />
                        <span className="hidden sm:inline text-xs text-light-secondary dark:text-dark-secondary truncate max-w-24">
                            {task.category?.name || "Uncategorized"}
                        </span>
                    </div>

                    {/* Priority */}
                    <div
                        className="flex items-center space-x-1"
                        title={`Priority: ${task.priority}`}
                    >
                        {getPriorityIcon(task.priority)}
                        <span className="text-xs text-light-muted dark:text-dark-muted hidden sm:inline">
                            {task.priority === "urgent"
                                ? "Focus"
                                : task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                    </div>

                    {/* Due Date */}
                    {task.due_date && (
                        <div
                            className={`flex items-center space-x-1 ${
                                isOverdue(task.due_date, task.status)
                                    ? "text-amber-600 dark:text-amber-200"
                                    : "text-light-muted dark:text-dark-muted"
                            }`}
                        >
                            <CalendarDays className="h-4 w-4" />
                            <span className="text-xs hidden sm:inline">
                                {taskDateValue(task.due_date).toLocaleDateString()}
                            </span>
                            <span className="text-xs sm:hidden">
                                {taskDateValue(task.due_date).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                })}
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

                    {/* Actions (desktop: hover-reveal at the end of the meta row) */}
                    <div className="hidden opacity-100 transition-opacity focus-within:opacity-100 sm:block sm:opacity-0 sm:group-hover:opacity-100">
                        <TaskActionsMenu items={actionItems} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Index({
    tasks = [],
    categories = [],
    tags = [],
    lists = [],
    filters = {},
    view = "today",
    taskCounts = {},
    today = null,
}) {
    const [allTasks, setAllTasks] = useState([]);
    const [search, setSearch] = useState(filters.search || "");
    const [priorityFilter, setPriorityFilter] = useState(filters.priority || "");
    const [categoryFilter, setCategoryFilter] = useState(filters.category_id || "");
    const [tagFilter, setTagFilter] = useState(filters.tag_id || "");
    const [dueDateFilter, setDueDateFilter] = useState(filters.due_date_filter || "");
    const [showFilters, setShowFilters] = useState(false);
    const [groupBy, setGroupBy] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("tasks.groupBy") || "none";
        }
        return "none";
    });
    const [collapsedGroups, setCollapsedGroups] = useState(() => new Set());
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showSubtaskModal, setShowSubtaskModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [isTaskSubmitting, setIsTaskSubmitting] = useState(false);
    const [needsAttentionOpen, setNeedsAttentionOpen] = useState(false);

    const currentView = view || "today";
    const now = new Date();
    const todayKey =
        today ||
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    // Load the full task set from props (already ordered and eager-loaded server-side)
    useEffect(() => {
        setAllTasks(tasks || []);
    }, [tasks]);

    // Persist the grouping choice so it survives filter-triggered reloads
    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("tasks.groupBy", groupBy);
        }
    }, [groupBy]);

    const toggleGroupCollapse = (key) => {
        setCollapsedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    // Handle task updates from modals
    const handleTaskUpdate = (updatedTask) => {
        setSelectedTask(updatedTask);
        // Also update the task in the all tasks list
        setAllTasks(allTasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    };

    // Handle task deletion
    const handleDeleteTask = (task) => {
        if (!confirm(`Remove "${task.title}"? You can add it again anytime.`)) {
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
                toast.error("We couldn’t remove that just now. Please try again.");
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

        const activeIndex = allTasks.findIndex((task) => task.id.toString() === active.id);
        const overIndex = allTasks.findIndex((task) => task.id.toString() === over.id);

        if (activeIndex === -1 || overIndex === -1) {
            return;
        }

        const activeTask = allTasks[activeIndex];
        const overTask = allTasks[overIndex];

        // Only allow reordering within the same status and priority group
        if (activeTask.status !== overTask.status || activeTask.priority !== overTask.priority) {
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
                toast.error("We couldn’t reorder that just now. Please try again.");
            });
    };

    const handleSearch = (value) => {
        setSearch(value);
        router.get(
            route("tasks.index"),
            {
                view: currentView,
                search: value,
                priority: priorityFilter,
                category_id: categoryFilter,
                tag_id: tagFilter,
                due_date_filter: dueDateFilter,
            },
            {
                preserveState: true,
                replace: true,
            }
        );
    };

    const handleFilter = (type, value) => {
        let newPriorityFilter = priorityFilter;
        let newCategoryFilter = categoryFilter;
        let newTagFilter = tagFilter;
        let newDueDateFilter = dueDateFilter;

        switch (type) {
            case "priority":
                newPriorityFilter = value;
                break;
            case "category":
                newCategoryFilter = value;
                break;
            case "tag":
                newTagFilter = value;
                break;
            case "due_date":
                newDueDateFilter = value;
                break;
        }

        setPriorityFilter(newPriorityFilter);
        setCategoryFilter(newCategoryFilter);
        setTagFilter(newTagFilter);
        setDueDateFilter(newDueDateFilter);

        router.get(
            route("tasks.index"),
            {
                view: currentView,
                search,
                priority: newPriorityFilter,
                category_id: newCategoryFilter,
                tag_id: newTagFilter,
                due_date_filter: newDueDateFilter,
            },
            {
                preserveState: true,
                replace: true,
            }
        );
    };

    const navigateView = (nextView) => {
        router.get(
            route("tasks.index"),
            {
                view: nextView,
                search,
                priority: priorityFilter,
                category_id: categoryFilter,
                tag_id: tagFilter,
                due_date_filter: dueDateFilter,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }
        );
    };

    const clearFilters = () => {
        setPriorityFilter("");
        setCategoryFilter("");
        setTagFilter("");
        setDueDateFilter("");

        router.get(
            route("tasks.index"),
            { view: currentView, search },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    const isOverdue = (dueDate, status) => {
        if (!dueDate || status === "completed") return false;
        return String(dueDate).slice(0, 10) < todayKey;
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
                          completed_at: newStatus === "completed" ? new Date().toISOString() : null,
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
                    const revertStatus = newStatus === "completed" ? "pending" : "completed";
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
                    toast.error("We couldn’t update that just now. Try again when you’re ready.");
                },
            }
        );
    };

    // Bucket a task's due date into a coarse time window for date grouping
    const getDueBucket = (task) => {
        if (!task.due_date) return "none";
        const due = taskDateValue(task.due_date);
        if (Number.isNaN(due.getTime())) return "none";

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfTomorrow = new Date(startOfToday);
        startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
        const startOfDayAfter = new Date(startOfToday);
        startOfDayAfter.setDate(startOfDayAfter.getDate() + 2);
        const startOfNextWeek = new Date(startOfToday);
        startOfNextWeek.setDate(startOfNextWeek.getDate() + 7);

        if (due < startOfToday) return "overdue";
        if (due < startOfTomorrow) return "today";
        if (due < startOfDayAfter) return "tomorrow";
        if (due < startOfNextWeek) return "this_week";
        return "later";
    };

    // Build the visible sections from the flat task list based on groupBy.
    // Each section is { key, label, color, tasks }; label === null renders no header.
    const taskGroups = useMemo(() => {
        if (groupBy === "none") {
            return [{ key: "all", label: null, color: null, tasks: allTasks }];
        }

        if (groupBy === "category") {
            const map = new Map();
            allTasks.forEach((task) => {
                const category = task.category;
                const key = category?.id ?? "uncategorized";
                if (!map.has(key)) {
                    map.set(key, {
                        key: `category-${key}`,
                        label: category?.name || "Uncategorized",
                        color: category?.color || "#6B7280",
                        tasks: [],
                    });
                }
                map.get(key).tasks.push(task);
            });
            return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
        }

        if (groupBy === "tag") {
            const map = new Map();
            const untagged = {
                key: "tag-none",
                label: "No tags",
                color: "#6B7280",
                tasks: [],
            };
            allTasks.forEach((task) => {
                const taskTags = task.tags || [];
                if (taskTags.length === 0) {
                    untagged.tasks.push(task);
                    return;
                }
                // A task with multiple tags appears under each of its tags
                taskTags.forEach((tag) => {
                    if (!map.has(tag.id)) {
                        map.set(tag.id, {
                            key: `tag-${tag.id}`,
                            label: tag.name,
                            color: tag.color || "#6B7280",
                            tasks: [],
                        });
                    }
                    map.get(tag.id).tasks.push(task);
                });
            });
            const groups = Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
            if (untagged.tasks.length) groups.push(untagged);
            return groups;
        }

        if (groupBy === "priority") {
            const map = new Map();
            allTasks.forEach((task) => {
                const key = task.priority || "none";
                if (!map.has(key)) {
                    map.set(key, {
                        key: `priority-${key}`,
                        label: PRIORITY_GROUP_LABELS[key] || "No priority",
                        color: PRIORITY_GROUP_COLORS[key] || "#6B7280",
                        tasks: [],
                    });
                }
                map.get(key).tasks.push(task);
            });
            const ordered = PRIORITY_GROUP_ORDER.filter((p) => map.has(p)).map((p) => map.get(p));
            if (map.has("none")) ordered.push(map.get("none"));
            return ordered;
        }

        if (groupBy === "due_date") {
            const buckets = {
                overdue: {
                    key: "due-overdue",
                    label: "Overdue",
                    color: "#EF4444",
                    tasks: [],
                },
                today: {
                    key: "due-today",
                    label: "Today",
                    color: "#F59E0B",
                    tasks: [],
                },
                tomorrow: {
                    key: "due-tomorrow",
                    label: "Tomorrow",
                    color: "#0EA5E9",
                    tasks: [],
                },
                this_week: {
                    key: "due-this-week",
                    label: "This week",
                    color: "#8B5CF6",
                    tasks: [],
                },
                later: {
                    key: "due-later",
                    label: "Later",
                    color: "#6B7280",
                    tasks: [],
                },
                none: {
                    key: "due-none",
                    label: "No due date",
                    color: "#6B7280",
                    tasks: [],
                },
            };
            allTasks.forEach((task) => {
                buckets[getDueBucket(task)].tasks.push(task);
            });
            return Object.values(buckets).filter((b) => b.tasks.length);
        }

        if (groupBy === "status") {
            const buckets = new Map(
                TASK_STATUS_OPTIONS.map((option) => [
                    option.value,
                    {
                        key: `status-${option.value}`,
                        label: option.label,
                        color: option.color,
                        tasks: [],
                    },
                ])
            );
            allTasks.forEach((task) => {
                const key = buckets.has(task.status) ? task.status : "pending";
                buckets.get(key).tasks.push(task);
            });
            return TASK_STATUS_OPTIONS.map((option) => buckets.get(option.value)).filter(
                (bucket) => bucket.tasks.length
            );
        }

        return [{ key: "all", label: null, color: null, tasks: allTasks }];
    }, [allTasks, groupBy]);

    // Render a drag-reorderable list of tasks. Each group gets its own
    // DndContext so reordering stays within a group.
    const renderTaskList = (tasks, reorderable = currentView === "all") => (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={reorderable ? handleDragEnd : undefined}
        >
            <SortableContext
                items={tasks.map((task) => task.id.toString())}
                strategy={verticalListSortingStrategy}
            >
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {tasks.map((task) => (
                        <SortableTask
                            key={task.id}
                            task={task}
                            isOverdue={isOverdue}
                            toggleTaskStatus={toggleTaskStatus}
                            setSelectedTask={setSelectedTask}
                            setShowViewModal={setShowViewModal}
                            setShowEditModal={setShowEditModal}
                            setShowSubtaskModal={setShowSubtaskModal}
                            handleDeleteTask={handleDeleteTask}
                            reorderable={reorderable}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );

    const focusViews = [
        { value: "today", label: "Today" },
        { value: "upcoming", label: "Upcoming" },
        { value: "inbox", label: "Inbox" },
        { value: "all", label: "All" },
        { value: "completed", label: "Completed" },
    ];
    const activeFilters = [
        priorityFilter && {
            type: "priority",
            label: `Priority: ${priorityFilter === "urgent" ? "Focus" : priorityFilter}`,
        },
        categoryFilter && {
            type: "category",
            label: `Category: ${categories.find((category) => String(category.id) === String(categoryFilter))?.name || "Selected"}`,
        },
        tagFilter && {
            type: "tag",
            label: `Tag: ${tags.find((tag) => String(tag.id) === String(tagFilter))?.name || "Selected"}`,
        },
        dueDateFilter && {
            type: "due_date",
            label: `Date: ${dueDateFilter.replaceAll("_", " ")}`,
        },
    ].filter(Boolean);
    const needsAttentionTasks =
        currentView === "today"
            ? allTasks.filter(
                  (task) => task.due_date && String(task.due_date).slice(0, 10) < todayKey
              )
            : [];
    const todayTasks =
        currentView === "today"
            ? allTasks.filter((task) => String(task.due_date).slice(0, 10) === todayKey)
            : allTasks;
    const viewLabel = focusViews.find((item) => item.value === currentView)?.label || "Tasks";

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
                    <div className="flex items-center gap-3" data-tour="tasks-create">
                        <button
                            onClick={() => setShowTaskModal(true)}
                            disabled={isTaskSubmitting}
                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-wevie-teal to-wevie-mint border border-transparent rounded-xl font-medium text-sm text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wevie-teal/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={isTaskSubmitting ? "Saving your task..." : "Create a new task"}
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
                <nav
                    aria-label="Task views"
                    data-tour="tasks-views"
                    className="flex gap-1 overflow-x-auto rounded-2xl border border-light-border/70 bg-white p-1.5 dark:border-dark-border/70 dark:bg-dark-card"
                >
                    {focusViews.map((item) => {
                        const isActive = currentView === item.value;
                        return (
                            <button
                                key={item.value}
                                type="button"
                                onClick={() => navigateView(item.value)}
                                aria-current={isActive ? "page" : undefined}
                                className={`inline-flex min-w-max items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-wevie-teal/40 ${
                                    isActive
                                        ? "bg-wevie-teal/10 text-wevie-teal dark:bg-wevie-mint/10 dark:text-wevie-mint"
                                        : "text-light-secondary hover:bg-light-hover dark:text-dark-secondary dark:hover:bg-dark-hover"
                                }`}
                            >
                                {item.label}
                                <span
                                    className={`rounded-full px-2 py-0.5 text-xs ${
                                        isActive
                                            ? "bg-wevie-teal/15 dark:bg-wevie-mint/15"
                                            : "bg-light-hover text-light-muted dark:bg-dark-hover dark:text-dark-muted"
                                    }`}
                                >
                                    {taskCounts[item.value] ?? 0}
                                </span>
                            </button>
                        );
                    })}
                </nav>

                {/* Search and Filters */}
                <div className="card" data-tour="tasks-filters">
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
                                        onChange={(e) => handleSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 border border-light-border/70 dark:border-dark-border/70 rounded-xl focus:ring-2 focus:ring-wevie-teal/40 focus:border-wevie-teal dark:bg-dark-card dark:text-dark-primary text-sm"
                                    />
                                </div>
                            </div>

                            {/* Filter Toggle */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`inline-flex items-center justify-center px-4 py-2.5 border rounded-xl text-sm font-medium transition-colors ${
                                    showFilters ||
                                    priorityFilter ||
                                    categoryFilter ||
                                    tagFilter ||
                                    dueDateFilter
                                        ? "bg-wevie-teal/10 border-wevie-teal/30 text-wevie-text-primary dark:bg-wevie-teal/10 dark:border-wevie-teal/30 dark:text-wevie-dark-text-primary"
                                        : "bg-white dark:bg-dark-card border-light-border/70 dark:border-dark-border/70 text-light-secondary dark:text-dark-secondary hover:bg-light-hover dark:hover:bg-dark-hover"
                                }`}
                            >
                                <Filter className="mr-2 h-4 w-4" />
                                Filters
                                {(priorityFilter ||
                                    categoryFilter ||
                                    tagFilter ||
                                    dueDateFilter) && (
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-wevie-teal/20 text-wevie-text-primary dark:bg-wevie-teal/20 dark:text-wevie-dark-text-primary">
                                        {
                                            [
                                                priorityFilter,
                                                categoryFilter,
                                                tagFilter,
                                                dueDateFilter,
                                            ].filter(Boolean).length
                                        }
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Filter Options */}
                        <Dialog
                            open={showFilters}
                            onClose={setShowFilters}
                            className="relative z-50"
                        >
                            <DialogBackdrop className="fixed inset-0 bg-slate-950/35 backdrop-blur-[1px]" />
                            <div className="fixed inset-0 flex justify-end">
                                <DialogPanel className="relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-light-border bg-light-card shadow-2xl dark:border-dark-border dark:bg-dark-card">
                                    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-light-border bg-light-card px-5 py-4 dark:border-dark-border dark:bg-dark-card">
                                        <div>
                                            <DialogTitle className="font-semibold text-light-primary dark:text-dark-primary">
                                                Filters
                                            </DialogTitle>
                                            <p className="mt-0.5 text-xs text-light-muted dark:text-dark-muted">
                                                Narrow this view without losing your place.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowFilters(false)}
                                            aria-label="Close filters"
                                            className="rounded-xl p-2 text-light-muted hover:bg-light-hover dark:text-dark-muted dark:hover:bg-dark-hover"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
                                        {/* Priority Filter */}
                                        <div>
                                            <label
                                                htmlFor="task-priority-filter"
                                                className="block text-sm font-medium text-light-secondary dark:text-dark-secondary mb-2"
                                            >
                                                Priority
                                            </label>
                                            <select
                                                id="task-priority-filter"
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
                                            <label
                                                htmlFor="task-category-filter"
                                                className="block text-sm font-medium text-light-secondary dark:text-dark-secondary mb-2"
                                            >
                                                Category
                                            </label>
                                            <select
                                                id="task-category-filter"
                                                value={categoryFilter}
                                                onChange={(e) =>
                                                    handleFilter("category", e.target.value)
                                                }
                                                className="block w-full border border-light-border/70 dark:border-dark-border/70 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-wevie-teal/40 focus:border-wevie-teal dark:bg-dark-card dark:text-dark-primary"
                                            >
                                                <option value="">All categories</option>
                                                {categories.map((category) => (
                                                    <option key={category.id} value={category.id}>
                                                        {category.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Tag Filter */}
                                        <div>
                                            <label
                                                htmlFor="task-tag-filter"
                                                className="block text-sm font-medium text-light-secondary dark:text-dark-secondary mb-2"
                                            >
                                                Tag
                                            </label>
                                            <select
                                                id="task-tag-filter"
                                                value={tagFilter}
                                                onChange={(e) =>
                                                    handleFilter("tag", e.target.value)
                                                }
                                                className="block w-full border border-light-border/70 dark:border-dark-border/70 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-wevie-teal/40 focus:border-wevie-teal dark:bg-dark-card dark:text-dark-primary"
                                            >
                                                <option value="">All tags</option>
                                                {tags.map((tag) => (
                                                    <option key={tag.id} value={tag.id}>
                                                        {tag.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Due Date Filter */}
                                        <div>
                                            <label
                                                htmlFor="task-date-filter"
                                                className="block text-sm font-medium text-light-secondary dark:text-dark-secondary mb-2"
                                            >
                                                Due date
                                            </label>
                                            <select
                                                id="task-date-filter"
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
                                </DialogPanel>
                            </div>
                        </Dialog>

                        {activeFilters.length > 0 && (
                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                {activeFilters.map((filter) => (
                                    <button
                                        key={filter.type}
                                        type="button"
                                        onClick={() => handleFilter(filter.type, "")}
                                        className="inline-flex items-center gap-1.5 rounded-full bg-wevie-teal/10 px-3 py-1.5 text-xs font-medium capitalize text-wevie-teal hover:bg-wevie-teal/15 focus:outline-none focus:ring-2 focus:ring-wevie-teal/40 dark:bg-wevie-mint/10 dark:text-wevie-mint"
                                        title={`Remove ${filter.label} filter`}
                                    >
                                        {filter.label}
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="px-2 py-1.5 text-xs font-medium text-light-muted hover:text-light-primary dark:text-dark-muted dark:hover:text-dark-primary"
                                >
                                    Clear all
                                </button>
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
                                    {viewLabel} ({allTasks.length})
                                </h3>
                            </div>
                            <div className="flex items-center gap-3">
                                {currentView === "all" && (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <label
                                                htmlFor="group-by"
                                                className="text-xs font-medium text-light-secondary dark:text-dark-secondary whitespace-nowrap"
                                            >
                                                Group by
                                            </label>
                                            <select
                                                id="group-by"
                                                value={groupBy}
                                                onChange={(e) => setGroupBy(e.target.value)}
                                                className="border border-light-border/70 dark:border-dark-border/70 rounded-lg pl-2.5 pr-8 py-1.5 text-xs focus:ring-2 focus:ring-wevie-teal/40 focus:border-wevie-teal dark:bg-dark-card dark:text-dark-primary"
                                            >
                                                <option value="none">None</option>
                                                <option value="category">Category</option>
                                                <option value="tag">Tag</option>
                                                <option value="due_date">Due date</option>
                                                <option value="priority">Priority</option>
                                                <option value="status">Status</option>
                                            </select>
                                        </div>
                                        <span className="hidden lg:inline text-xs text-light-muted dark:text-dark-muted">
                                            Drag to reorder • Tap a task to see details
                                        </span>
                                    </>
                                )}
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
                                priorityFilter ||
                                categoryFilter ||
                                tagFilter ||
                                dueDateFilter
                                    ? "Try a softer filter or a shorter search."
                                    : "Start with one small task when you’re ready."}
                            </p>
                            {!search &&
                                !priorityFilter &&
                                !categoryFilter &&
                                !tagFilter &&
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
                    ) : currentView === "today" ? (
                        <div>
                            {needsAttentionTasks.length > 0 && (
                                <div className="border-b border-light-border/70 dark:border-dark-border/70">
                                    <button
                                        type="button"
                                        onClick={() => setNeedsAttentionOpen(!needsAttentionOpen)}
                                        className="flex w-full items-center gap-2 bg-amber-50/60 px-4 py-3 text-left transition-colors hover:bg-amber-50 dark:bg-amber-950/10 dark:hover:bg-amber-950/20"
                                        aria-expanded={needsAttentionOpen}
                                    >
                                        {needsAttentionOpen ? (
                                            <ChevronDown className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                                        )}
                                        <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                            Needs attention
                                        </span>
                                        <span className="text-xs text-amber-700 dark:text-amber-300">
                                            {needsAttentionTasks.length}
                                        </span>
                                    </button>
                                    {needsAttentionOpen &&
                                        renderTaskList(needsAttentionTasks, false)}
                                </div>
                            )}
                            {todayTasks.length > 0 ? (
                                renderTaskList(todayTasks, false)
                            ) : (
                                <div className="p-10 text-center">
                                    <CheckSquare className="mx-auto mb-3 h-12 w-12 text-light-muted dark:text-dark-muted" />
                                    <h3 className="text-base font-medium text-light-primary dark:text-dark-primary">
                                        Today is clear
                                    </h3>
                                    <p className="mt-1 text-sm text-light-muted dark:text-dark-muted">
                                        Add one task if something needs your focus.
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : currentView !== "all" || groupBy === "none" ? (
                        renderTaskList(allTasks)
                    ) : (
                        <div className="divide-y divide-light-border/70 dark:divide-dark-border/70">
                            {taskGroups.map((group) => {
                                const isCollapsed = collapsedGroups.has(group.key);
                                return (
                                    <div key={group.key}>
                                        <button
                                            type="button"
                                            onClick={() => toggleGroupCollapse(group.key)}
                                            className="w-full flex items-center gap-2 px-4 py-2.5 bg-light-hover dark:bg-dark-hover hover:bg-light-border/40 dark:hover:bg-dark-border/40 transition-colors text-left"
                                        >
                                            {isCollapsed ? (
                                                <ChevronRight className="h-4 w-4 text-light-muted dark:text-dark-muted flex-shrink-0" />
                                            ) : (
                                                <ChevronDown className="h-4 w-4 text-light-muted dark:text-dark-muted flex-shrink-0" />
                                            )}
                                            {group.color && (
                                                <span
                                                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                                    style={{
                                                        backgroundColor: group.color,
                                                    }}
                                                />
                                            )}
                                            <span className="text-sm font-medium text-light-primary dark:text-dark-primary truncate">
                                                {group.label}
                                            </span>
                                            <span className="text-xs text-light-muted dark:text-dark-muted">
                                                ({group.tasks.length})
                                            </span>
                                        </button>
                                        {!isCollapsed && renderTaskList(group.tasks)}
                                    </div>
                                );
                            })}
                        </div>
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
                lists={lists}
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
                lists={lists}
                onTaskUpdate={handleTaskUpdate}
            />

            <QuickSubtaskModal
                show={showSubtaskModal}
                onClose={() => setShowSubtaskModal(false)}
                task={selectedTask}
                onSaved={() => {
                    if (!selectedTask) return;
                    // Bump the subtask count in place so the card reflects the
                    // new subtask without reloading the page.
                    handleTaskUpdate({
                        ...selectedTask,
                        subtasks_count: (selectedTask.subtasks_count || 0) + 1,
                    });
                }}
            />

            <Toast />
            <OnboardingTour tourKey="tasks" steps={tasksSteps} requireCompleted={["onboarding"]} />
        </TodoLayout>
    );
}

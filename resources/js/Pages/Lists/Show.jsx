import TodoLayout from "@/Layouts/TodoLayout";
import { Head, Link, router } from "@inertiajs/react";
import { useState, useMemo } from "react";
import {
    ArrowLeft,
    Edit,
    ListChecks,
    CheckSquare,
    Eye,
    Plus,
    Search,
    Link2Off,
} from "lucide-react";
import ListItemManager from "@/Components/ListItemManager";
import TaskViewModal from "@/Components/TaskViewModal";
import { toast } from "react-toastify";

export default function Show({ list, availableTasks = [] }) {
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showAttach, setShowAttach] = useState(false);
    const [attachSearch, setAttachSearch] = useState("");

    const tasks = list.tasks || [];

    // Candidate tasks to attach = the user's other tasks that aren't already in
    // this list. `availableTasks` is optionally provided by the backend; if it's
    // absent we simply hide the picker and point the user at the Tasks page.
    const attachedIds = useMemo(() => new Set((list.tasks || []).map((t) => t.id)), [list.tasks]);

    const candidateTasks = useMemo(() => {
        const term = attachSearch.trim().toLowerCase();
        return (availableTasks || [])
            .filter((t) => !attachedIds.has(t.id))
            .filter((t) => (term ? (t.title || "").toLowerCase().includes(term) : true));
    }, [availableTasks, attachedIds, attachSearch]);

    const handleDetach = (task) => {
        router.delete(route("lists.tasks.detach", [list.id, task.id]), {
            preserveScroll: true,
            onSuccess: () => toast.success("Task removed from this list."),
            onError: () => toast.error("We couldn’t remove that task just now. Please try again."),
        });
    };

    const handleAttach = (task) => {
        router.post(
            route("lists.tasks.attach", list.id),
            { task_id: task.id },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Task added to this list.");
                    setAttachSearch("");
                    setShowAttach(false);
                },
                onError: () => toast.error("We couldn’t add that task just now. Please try again."),
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
                return "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-dark-card/70";
        }
    };

    return (
        <TodoLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route("lists.index")}
                            className="inline-flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {list.name}
                        </h2>
                    </div>
                    <Link
                        href={route("lists.edit", list.id)}
                        className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-gradient-to-r from-wevie-teal to-wevie-mint border border-transparent text-white text-sm font-medium rounded-xl hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wevie-teal/40 transition-colors duration-200"
                    >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </Link>
                </div>
            }
        >
            <Head title={list.name} />
            <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
                {/* List Info Card */}
                <div className="card p-4 sm:p-6">
                    <div className="flex items-center gap-4">
                        <div
                            className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${list.color}20` }}
                        >
                            <ListChecks
                                className="w-6 h-6 sm:w-8 sm:h-8"
                                style={{ color: list.color }}
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                                {list.name}
                            </h3>
                            {list.description && (
                                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-2">
                                    {list.description}
                                </p>
                            )}
                            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                <span className="inline-flex items-center gap-1">
                                    <ListChecks className="h-4 w-4" />
                                    {(list.items || []).length} item
                                    {(list.items || []).length !== 1 ? "s" : ""}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                    <CheckSquare className="h-4 w-4" />
                                    {tasks.length} task
                                    {tasks.length !== 1 ? "s" : ""}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Two-column layout: items + tasks */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Items */}
                    <div className="card p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                            Checklist items
                        </h3>
                        <ListItemManager
                            key={`list-${list.id}`}
                            list={list}
                            items={list.items || []}
                            canEdit={true}
                        />
                    </div>

                    {/* Tasks in this list */}
                    <div className="card p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100">
                                Tasks in this list
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowAttach((v) => !v)}
                                className="inline-flex items-center text-sm text-wevie-teal hover:text-wevie-mint dark:text-wevie-mint dark:hover:text-wevie-teal transition-colors"
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Attach task
                            </button>
                        </div>

                        {/* Attach picker */}
                        {showAttach && (
                            <div className="mb-4 rounded-lg border border-light-border/70 dark:border-dark-border/70 p-3">
                                <div className="relative mb-2">
                                    <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={attachSearch}
                                        onChange={(e) => setAttachSearch(e.target.value)}
                                        placeholder="Search your tasks..."
                                        className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-wevie-teal/40 focus:border-wevie-teal dark:bg-gray-700 dark:text-white"
                                        autoFocus
                                    />
                                </div>
                                {!availableTasks || availableTasks.length === 0 ? (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 py-2">
                                        No tasks available to attach.{" "}
                                        <Link
                                            href={route("tasks.index")}
                                            className="text-wevie-teal dark:text-wevie-mint hover:underline"
                                        >
                                            Create a task
                                        </Link>{" "}
                                        first.
                                    </p>
                                ) : candidateTasks.length === 0 ? (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 py-2">
                                        No matching tasks.
                                    </p>
                                ) : (
                                    <ul className="max-h-48 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                                        {candidateTasks.map((task) => (
                                            <li key={task.id}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAttach(task)}
                                                    className="flex w-full items-center gap-2 px-1 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                                                >
                                                    <Plus className="h-4 w-4 flex-shrink-0 text-wevie-teal dark:text-wevie-mint" />
                                                    <span className="truncate">{task.title}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}

                        {tasks.length === 0 ? (
                            <div className="py-8 text-center">
                                <CheckSquare className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    No tasks attached yet. Use “Attach task” to add one.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {tasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className="flex items-center gap-2 rounded-lg border border-light-border/60 dark:border-dark-border/60 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedTask(task);
                                                        setShowViewModal(true);
                                                    }}
                                                    className={`text-sm font-medium truncate text-left hover:text-wevie-teal dark:hover:text-wevie-mint transition-colors ${
                                                        task.status === "completed"
                                                            ? "text-gray-500 dark:text-gray-400 line-through"
                                                            : "text-gray-900 dark:text-gray-100"
                                                    }`}
                                                    title="Click to view task details"
                                                >
                                                    {task.title}
                                                </button>
                                                {task.priority && (
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                                                            task.priority
                                                        )}`}
                                                    >
                                                        {task.priority.charAt(0).toUpperCase() +
                                                            task.priority.slice(1)}
                                                    </span>
                                                )}
                                            </div>
                                            {task.description && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                                                    {task.description}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedTask(task);
                                                setShowViewModal(true);
                                            }}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                            title="View task"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDetach(task)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                            title="Remove from list"
                                        >
                                            <Link2Off className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Back link */}
                <div>
                    <Link
                        href={route("lists.index")}
                        className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Lists
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
                onTaskUpdate={() => {
                    // Keep server state authoritative for task edits done in the
                    // modal by reloading the list's tasks.
                    router.reload({ only: ["list"] });
                }}
            />
        </TodoLayout>
    );
}

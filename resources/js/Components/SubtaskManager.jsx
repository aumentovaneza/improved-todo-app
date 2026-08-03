import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import {
    Plus,
    X,
    Check,
    Circle,
    Edit,
    Trash2,
    GripVertical,
} from "lucide-react";
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

function SortableSubtask({
    subtask,
    index,
    canEdit,
    editingSubtask,
    editTitle,
    onToggle,
    onStartEdit,
    onEditTitleChange,
    onSaveEdit,
    onCancelEdit,
    onDelete,
    isLoading = false,
    isDeleting = false,
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: subtask.id.toString(),
        disabled: !canEdit || isLoading || isDeleting,
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
            className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                isDragging
                    ? "bg-gray-100 dark:bg-gray-600"
                    : isDeleting
                    ? "bg-red-50 dark:bg-red-900/20 opacity-50"
                    : "bg-gray-50 dark:bg-gray-700"
            }`}
        >
            {canEdit && (
                <div {...attributes} {...listeners} className="cursor-move">
                    <GripVertical className="h-4 w-4 text-gray-400" />
                </div>
            )}

            <button
                type="button"
                onClick={() => onToggle(subtask)}
                disabled={isLoading}
                className={`flex-shrink-0 transition-transform ${
                    isLoading
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer hover:scale-110"
                }`}
            >
                {subtask.is_completed ? (
                    <Check className="h-4 w-4 text-green-500 bg-green-100 dark:bg-green-900 rounded-full p-0.5" />
                ) : (
                    <Circle className="h-4 w-4 text-gray-400" />
                )}
            </button>

            <div className="flex-1 min-w-0">
                {editingSubtask === subtask.id ? (
                    <div className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => onEditTitleChange(e.target.value)}
                            onKeyPress={(e) =>
                                e.key === "Enter" && onSaveEdit(subtask)
                            }
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                            autoFocus
                        />
                        <button
                            type="button"
                            onClick={() => onSaveEdit(subtask)}
                            className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                        >
                            <Check className="h-3 w-3" />
                        </button>
                        <button
                            type="button"
                            onClick={onCancelEdit}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                ) : (
                    <span
                        className={`text-sm ${
                            subtask.is_completed
                                ? "line-through text-gray-500 dark:text-gray-400"
                                : "text-gray-900 dark:text-gray-100"
                        }`}
                    >
                        {subtask.title}
                    </span>
                )}
            </div>

            {canEdit && editingSubtask !== subtask.id && (
                <div className="flex items-center space-x-1">
                    <button
                        type="button"
                        onClick={() => onStartEdit(subtask)}
                        disabled={isLoading || isDeleting}
                        className={`p-1 ${
                            isLoading || isDeleting
                                ? "text-gray-300 cursor-not-allowed"
                                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        }`}
                    >
                        <Edit className="h-3 w-3" />
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete(subtask)}
                        disabled={isLoading || isDeleting}
                        className={`p-1 ${
                            isLoading || isDeleting
                                ? "text-gray-300 cursor-not-allowed"
                                : "text-red-400 hover:text-red-600 dark:hover:text-red-300"
                        }`}
                    >
                        <Trash2 className="h-3 w-3" />
                    </button>
                </div>
            )}
        </div>
    );
}

export default function SubtaskManager({
    task,
    subtasks: initialSubtasks = [],
    canEdit = false,
    onTaskUpdate = null,
}) {
    const [subtasks, setSubtasks] = useState(initialSubtasks);

    // A synchronous mirror of the subtask list. Because several subtask
    // requests (toggle/edit/delete/reorder) now run as independent background
    // XHRs, their async callbacks can't rely on the `subtasks` closure (stale)
    // or on a React state-updater running synchronously. This ref is the single
    // source of truth each callback reads and writes through `applySubtasks`.
    const subtasksRef = useRef(initialSubtasks);

    // Sync local state with prop changes
    useEffect(() => {
        subtasksRef.current = initialSubtasks;
        setSubtasks(initialSubtasks);
    }, [initialSubtasks]);

    // Apply a transform to the current list, updating both the ref (synchronously)
    // and React state, and return the concrete next list so callers can hand an
    // accurate value to `onTaskUpdate` without awaiting a re-render.
    const applySubtasks = (updater) => {
        const next = updater(subtasksRef.current);
        subtasksRef.current = next;
        setSubtasks(next);
        return next;
    };

    const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
    const [isAddingSubtask, setIsAddingSubtask] = useState(false);
    const [editingSubtask, setEditingSubtask] = useState(null);
    const [editTitle, setEditTitle] = useState("");
    const [loadingSubtasks, setLoadingSubtasks] = useState(new Set());
    const [deletingSubtasks, setDeletingSubtasks] = useState(new Set());

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Display order: incomplete subtasks first (in their existing position order),
    // then completed ones grouped at the bottom under a "Done" section. Completed
    // subtasks are sorted so the most recently finished sits at the very bottom.
    const activeSubtasks = subtasks.filter((s) => !s.is_completed);
    const doneSubtasks = subtasks
        .filter((s) => s.is_completed)
        .sort((a, b) => {
            if (!a.completed_at && !b.completed_at) return 0;
            if (!a.completed_at) return 1; // nulls last
            if (!b.completed_at) return -1;
            return a.completed_at.localeCompare(b.completed_at);
        });
    const orderedSubtasks = [...activeSubtasks, ...doneSubtasks];

    const handleAddSubtask = () => {
        if (!newSubtaskTitle.trim()) return;

        const tempSubtask = {
            id: Date.now(), // Temporary ID
            title: newSubtaskTitle,
            is_completed: false,
            completed_at: null,
            position: subtasks.length,
            task_id: task.id,
        };

        applySubtasks((prev) => [...prev, tempSubtask]);
        const titleToAdd = newSubtaskTitle;
        setNewSubtaskTitle("");
        setIsAddingSubtask(false);

        // Save in the background via a plain XHR (no Inertia visit) so the page
        // never reloads and the optimistic row stays put instantly.
        window.axios
            .post(
                route("subtasks.store"),
                {
                    task_id: task.id,
                    title: titleToAdd,
                },
                { headers: { Accept: "application/json" } }
            )
            .then((response) => {
                // Reconcile the temporary client id with the real database id
                // returned from the server, otherwise later edit/toggle/delete
                // requests would target a non-existent subtask.
                const created = response?.data?.subtask;

                // Reconcile the temporary row with the server row against the
                // freshest list (other rows may have changed meanwhile).
                const nextSubtasks = applySubtasks((prev) =>
                    created?.id
                        ? prev.map((s) =>
                              s.id === tempSubtask.id
                                  ? { ...s, ...created }
                                  : s
                          )
                        : prev
                );

                // Update parent component's task data if callback provided
                if (onTaskUpdate) {
                    onTaskUpdate({
                        ...task,
                        subtasks: nextSubtasks,
                    });
                }
                toast.success("Subtask saved.");
            })
            .catch((error) => {
                applySubtasks((prev) =>
                    prev.filter((s) => s.id !== tempSubtask.id)
                );
                toast.error(
                    error?.response?.data?.error ||
                        "We couldn’t save that just now. Try again when you’re ready."
                );
            });
    };

    const handleToggleSubtask = (subtask) => {
        // Prevent multiple simultaneous requests for the same subtask
        if (loadingSubtasks.has(subtask.id)) {
            return;
        }

        const newStatus = !subtask.is_completed;

        // Add subtask to loading state
        setLoadingSubtasks((prev) => new Set(prev).add(subtask.id));

        // Optimistic flip against the freshest list so concurrent toggles of
        // different subtasks build on each other rather than clobbering.
        applySubtasks((prev) =>
            prev.map((s) =>
                s.id === subtask.id
                    ? {
                          ...s,
                          is_completed: newStatus,
                          completed_at: newStatus
                              ? new Date().toISOString()
                              : null,
                      }
                    : s
            )
        );

        const clearLoading = () =>
            setLoadingSubtasks((prev) => {
                const newSet = new Set(prev);
                newSet.delete(subtask.id);
                return newSet;
            });

        // Save via a plain background XHR (no Inertia visit). Inertia runs one
        // visit at a time and cancels any in-flight one when a new visit
        // starts, so router.post here would drop earlier toggles when several
        // subtasks are ticked in quick succession. A bare XHR runs
        // independently and every toggle persists.
        window.axios
            .post(
                route("subtasks.toggle", subtask.id),
                {},
                { headers: { Accept: "application/json" } }
            )
            .then((response) => {
                clearLoading();

                // Reconcile from server truth (authoritative is_completed /
                // completed_at) against the freshest list.
                const updated = response?.data?.subtask;
                const nextSubtasks = applySubtasks((prev) =>
                    updated?.id
                        ? prev.map((s) =>
                              s.id === subtask.id ? { ...s, ...updated } : s
                          )
                        : prev
                );

                // Update parent component's task data if callback provided
                if (onTaskUpdate) {
                    onTaskUpdate({
                        ...task,
                        subtasks: nextSubtasks,
                    });
                }
                toast.success(
                    newStatus
                        ? "Subtask set to done."
                        : "Subtask is back on your list."
                );
            })
            .catch(() => {
                clearLoading();

                // Revert the optimistic flip against the freshest list.
                applySubtasks((prev) =>
                    prev.map((s) =>
                        s.id === subtask.id
                            ? {
                                  ...s,
                                  is_completed: !newStatus,
                                  completed_at: !newStatus
                                      ? new Date().toISOString()
                                      : null,
                              }
                            : s
                    )
                );
                toast.error(
                    "We couldn’t update that just now. Try again when you’re ready."
                );
            });
    };

    const handleEditSubtask = (subtask) => {
        if (!editTitle.trim()) return;

        const oldTitle = subtask.title;
        const newTitle = editTitle;
        applySubtasks((prev) =>
            prev.map((s) =>
                s.id === subtask.id ? { ...s, title: newTitle } : s
            )
        );
        setEditingSubtask(null);
        setEditTitle("");

        // Background XHR (no Inertia visit) so it never cancels an in-flight
        // toggle/edit of another subtask. See handleToggleSubtask.
        window.axios
            .put(
                route("subtasks.update", subtask.id),
                {
                    title: newTitle,
                    is_completed: subtask.is_completed,
                },
                { headers: { Accept: "application/json" } }
            )
            .then((response) => {
                const updated = response?.data?.subtask;
                const nextSubtasks = applySubtasks((prev) =>
                    updated?.id
                        ? prev.map((s) =>
                              s.id === subtask.id ? { ...s, ...updated } : s
                          )
                        : prev
                );

                // Update parent component's task data if callback provided
                if (onTaskUpdate) {
                    onTaskUpdate({
                        ...task,
                        subtasks: nextSubtasks,
                    });
                }
                toast.success("Subtask updated.");
            })
            .catch(() => {
                applySubtasks((prev) =>
                    prev.map((s) =>
                        s.id === subtask.id ? { ...s, title: oldTitle } : s
                    )
                );
                toast.error(
                    "We couldn’t update that just now. Try again when you’re ready."
                );
            });
    };

    const handleDeleteSubtask = (subtask) => {
        if (!confirm("Remove this subtask? You can add it again later.")) return;

        // Prevent multiple delete requests for the same subtask
        if (deletingSubtasks.has(subtask.id)) {
            return;
        }

        // Add subtask to deleting state
        setDeletingSubtasks((prev) => new Set(prev).add(subtask.id));

        const clearDeleting = () =>
            setDeletingSubtasks((prev) => {
                const newSet = new Set(prev);
                newSet.delete(subtask.id);
                return newSet;
            });

        // Background XHR (no Inertia visit) so it never cancels an in-flight
        // toggle/edit/delete of another subtask. See handleToggleSubtask.
        // Don't update UI optimistically for delete - wait for server confirmation.
        window.axios
            .delete(route("subtasks.destroy", subtask.id), {
                headers: { Accept: "application/json" },
            })
            .then(() => {
                clearDeleting();

                const nextSubtasks = applySubtasks((prev) =>
                    prev.filter((s) => s.id !== subtask.id)
                );

                // Update parent component's task data if callback provided
                if (onTaskUpdate) {
                    onTaskUpdate({
                        ...task,
                        subtasks: nextSubtasks,
                    });
                }
                toast.success("Subtask removed.");
            })
            .catch(() => {
                clearDeleting();
                toast.error(
                    "We couldn’t remove that just now. Please try again."
                );
            });
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        // Store the original order before making changes
        const originalSubtasks = Array.from(subtasksRef.current);

        // Reorder against the displayed (grouped) order so drops line up with
        // what the user actually sees.
        const oldIndex = orderedSubtasks.findIndex(
            (item) => item.id.toString() === active.id
        );
        const newIndex = orderedSubtasks.findIndex(
            (item) => item.id.toString() === over.id
        );

        if (oldIndex === -1 || newIndex === -1) {
            return;
        }

        // Don't allow dragging across the active/Done boundary — a completed
        // subtask always belongs in the Done section and would just snap back.
        if (
            orderedSubtasks[oldIndex].is_completed !==
            orderedSubtasks[newIndex].is_completed
        ) {
            return;
        }

        const newSubtasks = arrayMove(orderedSubtasks, oldIndex, newIndex);

        // Optimistically update the UI (and the ref source of truth).
        applySubtasks(() => newSubtasks);

        // Background XHR (no Inertia visit) so it never cancels an in-flight
        // toggle/edit/delete of another subtask. See handleToggleSubtask.
        window.axios
            .post(
                route("subtasks.reorder"),
                {
                    task_id: task.id,
                    subtaskIds: newSubtasks.map((item) => item.id),
                },
                { headers: { Accept: "application/json" } }
            )
            .then(() => {
                // Update parent component's task data if callback provided
                if (onTaskUpdate) {
                    onTaskUpdate({
                        ...task,
                        subtasks: newSubtasks,
                    });
                }
                toast.success("Subtasks reordered.");
            })
            .catch(() => {
                // Revert to the original order on error
                applySubtasks(() => originalSubtasks);
                toast.error(
                    "We couldn’t reorder that just now. Please try again."
                );
            });
    };

    const startEdit = (subtask) => {
        setEditingSubtask(subtask.id);
        setEditTitle(subtask.title);
    };

    const cancelEdit = () => {
        setEditingSubtask(null);
        setEditTitle("");
    };

    if (!canEdit && subtasks.length === 0) {
        return null;
    }

    return (
        <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Subtasks ({subtasks.filter((s) => s.is_completed).length}/
                    {subtasks.length})
                </h3>
                {canEdit && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            setIsAddingSubtask(true);
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Subtask
                    </button>
                )}
            </div>

            {isAddingSubtask && (
                <div className="mb-3 flex items-center space-x-2">
                    <input
                        type="text"
                        placeholder="Subtask title..."
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        onKeyPress={(e) =>
                            e.key === "Enter" && handleAddSubtask()
                        }
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        autoFocus
                    />
                    <button
                        type="button"
                        onClick={handleAddSubtask}
                        className="p-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                    >
                        <Check className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setIsAddingSubtask(false);
                            setNewSubtaskTitle("");
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {subtasks.length > 0 && (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={orderedSubtasks.map((s) => s.id.toString())}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-2">
                            {orderedSubtasks.map((subtask, index) => (
                                <div key={subtask.id}>
                                    {/* Divider before the first completed row */}
                                    {subtask.is_completed &&
                                        index ===
                                            activeSubtasks.length && (
                                            <div
                                                className={`text-xs font-medium text-gray-500 dark:text-gray-400 pt-2 pb-1 ${
                                                    activeSubtasks.length > 0
                                                        ? "mt-2 border-t border-gray-200 dark:border-gray-600"
                                                        : ""
                                                }`}
                                            >
                                                Done ({doneSubtasks.length})
                                            </div>
                                        )}
                                    <SortableSubtask
                                        subtask={subtask}
                                        index={index}
                                        canEdit={canEdit}
                                        editingSubtask={editingSubtask}
                                        editTitle={editTitle}
                                        onToggle={handleToggleSubtask}
                                        onStartEdit={startEdit}
                                        onEditTitleChange={setEditTitle}
                                        onSaveEdit={handleEditSubtask}
                                        onCancelEdit={cancelEdit}
                                        onDelete={handleDeleteSubtask}
                                        isLoading={loadingSubtasks.has(
                                            subtask.id
                                        )}
                                        isDeleting={deletingSubtasks.has(
                                            subtask.id
                                        )}
                                    />
                                </div>
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}
        </div>
    );
}

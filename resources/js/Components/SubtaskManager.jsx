import { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
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
        disabled: !canEdit,
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
                className="flex-shrink-0 cursor-pointer hover:scale-110 transition-transform"
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
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <Edit className="h-3 w-3" />
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete(subtask)}
                        className="p-1 text-red-400 hover:text-red-600 dark:hover:text-red-300"
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

    // Sync local state with prop changes
    useEffect(() => {
        setSubtasks(initialSubtasks);
    }, [initialSubtasks]);

    const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
    const [isAddingSubtask, setIsAddingSubtask] = useState(false);
    const [editingSubtask, setEditingSubtask] = useState(null);
    const [editTitle, setEditTitle] = useState("");

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

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

        setSubtasks([...subtasks, tempSubtask]);
        const titleToAdd = newSubtaskTitle;
        setNewSubtaskTitle("");
        setIsAddingSubtask(false);

        router.post(
            route("subtasks.store"),
            {
                task_id: task.id,
                title: titleToAdd,
            },
            {
                preserveScroll: true,
                preserveState: true,
                only: [], // Don't reload any data
                onSuccess: () => {
                    // Update parent component's task data if callback provided
                    if (onTaskUpdate) {
                        onTaskUpdate({
                            ...task,
                            subtasks: subtasks,
                        });
                    }
                    toast.success("Subtask created successfully");
                },
                onError: () => {
                    setSubtasks((prev) =>
                        prev.filter((s) => s.id !== tempSubtask.id)
                    );
                    toast.error("Failed to create subtask");
                },
            }
        );
    };

    const handleToggleSubtask = (subtask) => {
        const newStatus = !subtask.is_completed;

        setSubtasks(
            subtasks.map((s) =>
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

        router.post(
            route("subtasks.toggle", subtask.id),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                only: [], // Don't reload any data
                onSuccess: () => {
                    // Update parent component's task data if callback provided
                    if (onTaskUpdate) {
                        onTaskUpdate({
                            ...task,
                            subtasks: subtasks,
                        });
                    }
                    toast.success(
                        newStatus
                            ? "Subtask completed!"
                            : "Subtask marked as pending"
                    );
                },
                onError: () => {
                    setSubtasks(
                        subtasks.map((s) =>
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
                    toast.error("Failed to update subtask");
                },
            }
        );
    };

    const handleEditSubtask = (subtask) => {
        if (!editTitle.trim()) return;

        const oldTitle = subtask.title;
        setSubtasks(
            subtasks.map((s) =>
                s.id === subtask.id ? { ...s, title: editTitle } : s
            )
        );
        setEditingSubtask(null);
        setEditTitle("");

        router.put(
            route("subtasks.update", subtask.id),
            {
                title: editTitle,
                is_completed: subtask.is_completed,
            },
            {
                preserveScroll: true,
                preserveState: true,
                only: [], // Don't reload any data
                onSuccess: () => {
                    // Update parent component's task data if callback provided
                    if (onTaskUpdate) {
                        onTaskUpdate({
                            ...task,
                            subtasks: subtasks,
                        });
                    }
                    toast.success("Subtask updated successfully");
                },
                onError: () => {
                    setSubtasks(
                        subtasks.map((s) =>
                            s.id === subtask.id ? { ...s, title: oldTitle } : s
                        )
                    );
                    toast.error("Failed to update subtask");
                },
            }
        );
    };

    const handleDeleteSubtask = (subtask) => {
        if (!confirm("Are you sure you want to delete this subtask?")) return;

        // Don't update UI optimistically for delete - wait for server confirmation
        router.delete(route("subtasks.destroy", subtask.id), {
            preserveScroll: true,
            preserveState: true,
            only: [], // Don't reload any data
            onSuccess: () => {
                // Update parent component's task data if callback provided
                if (onTaskUpdate) {
                    onTaskUpdate({
                        ...task,
                        subtasks: subtasks.filter((s) => s.id !== subtask.id),
                    });
                }
                toast.success("Subtask deleted successfully");
            },
            onError: () => {
                toast.error("Failed to delete subtask");
            },
        });
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        // Store the original order before making changes
        const originalSubtasks = Array.from(subtasks);

        const oldIndex = subtasks.findIndex(
            (item) => item.id.toString() === active.id
        );
        const newIndex = subtasks.findIndex(
            (item) => item.id.toString() === over.id
        );

        if (oldIndex === -1 || newIndex === -1) {
            return;
        }

        const newSubtasks = arrayMove(subtasks, oldIndex, newIndex);

        // Optimistically update the UI
        setSubtasks(newSubtasks);

        router.post(
            route("subtasks.reorder"),
            {
                task_id: task.id,
                subtaskIds: newSubtasks.map((item) => item.id),
            },
            {
                preserveScroll: true,
                preserveState: true,
                only: [], // Don't reload any data
                onSuccess: () => {
                    // Update parent component's task data if callback provided
                    if (onTaskUpdate) {
                        onTaskUpdate({
                            ...task,
                            subtasks: newSubtasks,
                        });
                    }
                    toast.success("Subtasks reordered successfully");
                },
                onError: () => {
                    // Revert to the original order on error
                    setSubtasks(originalSubtasks);
                    toast.error("Failed to reorder subtasks");
                },
            }
        );
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
                        items={subtasks.map((s) => s.id.toString())}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-2">
                            {subtasks.map((subtask, index) => (
                                <SortableSubtask
                                    key={subtask.id}
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
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}
        </div>
    );
}

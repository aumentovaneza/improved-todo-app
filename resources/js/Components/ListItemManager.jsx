import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { Plus, X, Check, Circle, Edit, Trash2, GripVertical } from "lucide-react";
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

function SortableItem({
    item,
    canEdit,
    editingItem,
    editContent,
    onToggle,
    onStartEdit,
    onEditContentChange,
    onSaveEdit,
    onCancelEdit,
    onDelete,
    isLoading = false,
    isDeleting = false,
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: item.id.toString(),
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
                    ? "bg-light-hover dark:bg-dark-hover"
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
                onClick={() => onToggle(item)}
                disabled={isLoading}
                className={`flex-shrink-0 transition-transform ${
                    isLoading ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:scale-110"
                }`}
            >
                {item.is_completed ? (
                    <Check className="h-4 w-4 text-green-500 bg-green-100 dark:bg-green-900 rounded-full p-0.5" />
                ) : (
                    <Circle className="h-4 w-4 text-gray-400" />
                )}
            </button>

            <div className="flex-1 min-w-0">
                {editingItem === item.id ? (
                    <div className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={editContent}
                            onChange={(e) => onEditContentChange(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && onSaveEdit(item)}
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-wevie-teal/40 focus:border-wevie-teal dark:bg-gray-600 dark:text-white"
                            autoFocus
                        />
                        <button
                            type="button"
                            onClick={() => onSaveEdit(item)}
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
                            item.is_completed
                                ? "line-through text-gray-500 dark:text-gray-400"
                                : "text-gray-900 dark:text-gray-100"
                        }`}
                    >
                        {item.content}
                    </span>
                )}
            </div>

            {canEdit && editingItem !== item.id && (
                <div className="flex items-center space-x-1">
                    <button
                        type="button"
                        onClick={() => onStartEdit(item)}
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
                        onClick={() => onDelete(item)}
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

export default function ListItemManager({ list, items: initialItems = [], canEdit = true }) {
    const [items, setItems] = useState(initialItems);

    // A synchronous mirror of the item list. Because several item requests
    // (toggle/edit/delete/reorder) run as independent background XHRs, their
    // async callbacks can't rely on the `items` closure (stale) or on a React
    // state-updater running synchronously. This ref is the single source of
    // truth each callback reads and writes through `applyItems`.
    const itemsRef = useRef(initialItems);

    // Sync local state with prop changes
    useEffect(() => {
        itemsRef.current = initialItems;
        setItems(initialItems);
    }, [initialItems]);

    // Apply a transform to the current list, updating both the ref (synchronously)
    // and React state, and return the concrete next list.
    const applyItems = (updater) => {
        const next = updater(itemsRef.current);
        itemsRef.current = next;
        setItems(next);
        return next;
    };

    const [newItemContent, setNewItemContent] = useState("");
    const [isAddingItem, setIsAddingItem] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [editContent, setEditContent] = useState("");
    const [loadingItems, setLoadingItems] = useState(new Set());
    const [deletingItems, setDeletingItems] = useState(new Set());

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Display order: incomplete items first (in their existing position order),
    // then completed ones grouped at the bottom under a "Done" section. Completed
    // items are sorted so the most recently finished sits at the very bottom.
    const activeItems = items.filter((s) => !s.is_completed);
    const doneItems = items
        .filter((s) => s.is_completed)
        .sort((a, b) => {
            if (!a.completed_at && !b.completed_at) return 0;
            if (!a.completed_at) return 1; // nulls last
            if (!b.completed_at) return -1;
            return a.completed_at.localeCompare(b.completed_at);
        });
    const orderedItems = [...activeItems, ...doneItems];

    const handleAddItem = () => {
        if (!newItemContent.trim()) return;

        const tempItem = {
            id: Date.now(), // Temporary ID
            content: newItemContent,
            is_completed: false,
            completed_at: null,
            position: items.length,
            task_list_id: list.id,
        };

        applyItems((prev) => [...prev, tempItem]);
        const contentToAdd = newItemContent;
        setNewItemContent("");
        setIsAddingItem(false);

        // Save in the background via a plain XHR (no Inertia visit) so the page
        // never reloads and the optimistic row stays put instantly.
        window.axios
            .post(
                route("list-items.store"),
                {
                    task_list_id: list.id,
                    content: contentToAdd,
                },
                { headers: { Accept: "application/json" } }
            )
            .then((response) => {
                // Reconcile the temporary client id with the real database id
                // returned from the server, otherwise later edit/toggle/delete
                // requests would target a non-existent item.
                const created = response?.data?.item;

                applyItems((prev) =>
                    created?.id
                        ? prev.map((s) => (s.id === tempItem.id ? { ...s, ...created } : s))
                        : prev
                );
                toast.success("Item saved.");
            })
            .catch((error) => {
                applyItems((prev) => prev.filter((s) => s.id !== tempItem.id));
                toast.error(
                    error?.response?.data?.error ||
                        "We couldn’t save that just now. Try again when you’re ready."
                );
            });
    };

    const handleToggleItem = (item) => {
        // Prevent multiple simultaneous requests for the same item
        if (loadingItems.has(item.id)) {
            return;
        }

        const newStatus = !item.is_completed;

        setLoadingItems((prev) => new Set(prev).add(item.id));

        // Optimistic flip against the freshest list so concurrent toggles of
        // different items build on each other rather than clobbering.
        applyItems((prev) =>
            prev.map((s) =>
                s.id === item.id
                    ? {
                          ...s,
                          is_completed: newStatus,
                          completed_at: newStatus ? new Date().toISOString() : null,
                      }
                    : s
            )
        );

        const clearLoading = () =>
            setLoadingItems((prev) => {
                const newSet = new Set(prev);
                newSet.delete(item.id);
                return newSet;
            });

        // Save via a plain background XHR (no Inertia visit). Inertia runs one
        // visit at a time and cancels any in-flight one when a new visit
        // starts, so router.post here would drop earlier toggles when several
        // items are ticked in quick succession. A bare XHR runs independently
        // and every toggle persists.
        window.axios
            .post(
                route("list-items.toggle", item.id),
                {},
                { headers: { Accept: "application/json" } }
            )
            .then((response) => {
                clearLoading();

                // Reconcile from server truth against the freshest list.
                const updated = response?.data?.item;
                applyItems((prev) =>
                    updated?.id
                        ? prev.map((s) => (s.id === item.id ? { ...s, ...updated } : s))
                        : prev
                );
                toast.success(newStatus ? "Item set to done." : "Item is back on your list.");
            })
            .catch(() => {
                clearLoading();

                // Revert the optimistic flip against the freshest list.
                applyItems((prev) =>
                    prev.map((s) =>
                        s.id === item.id
                            ? {
                                  ...s,
                                  is_completed: !newStatus,
                                  completed_at: !newStatus ? new Date().toISOString() : null,
                              }
                            : s
                    )
                );
                toast.error("We couldn’t update that just now. Try again when you’re ready.");
            });
    };

    const handleEditItem = (item) => {
        if (!editContent.trim()) return;

        const oldContent = item.content;
        const newContent = editContent;
        applyItems((prev) =>
            prev.map((s) => (s.id === item.id ? { ...s, content: newContent } : s))
        );
        setEditingItem(null);
        setEditContent("");

        // Background XHR (no Inertia visit) so it never cancels an in-flight
        // toggle/edit of another item. See handleToggleItem.
        window.axios
            .put(
                route("list-items.update", item.id),
                {
                    content: newContent,
                    is_completed: item.is_completed,
                },
                { headers: { Accept: "application/json" } }
            )
            .then((response) => {
                const updated = response?.data?.item;
                applyItems((prev) =>
                    updated?.id
                        ? prev.map((s) => (s.id === item.id ? { ...s, ...updated } : s))
                        : prev
                );
                toast.success("Item updated.");
            })
            .catch(() => {
                applyItems((prev) =>
                    prev.map((s) => (s.id === item.id ? { ...s, content: oldContent } : s))
                );
                toast.error("We couldn’t update that just now. Try again when you’re ready.");
            });
    };

    const handleDeleteItem = (item) => {
        if (!confirm("Remove this item? You can add it again later.")) return;

        // Prevent multiple delete requests for the same item
        if (deletingItems.has(item.id)) {
            return;
        }

        setDeletingItems((prev) => new Set(prev).add(item.id));

        const clearDeleting = () =>
            setDeletingItems((prev) => {
                const newSet = new Set(prev);
                newSet.delete(item.id);
                return newSet;
            });

        // Background XHR (no Inertia visit) so it never cancels an in-flight
        // toggle/edit/delete of another item. See handleToggleItem.
        // Don't update UI optimistically for delete - wait for server confirmation.
        window.axios
            .delete(route("list-items.destroy", item.id), {
                headers: { Accept: "application/json" },
            })
            .then(() => {
                clearDeleting();

                applyItems((prev) => prev.filter((s) => s.id !== item.id));
                toast.success("Item removed.");
            })
            .catch(() => {
                clearDeleting();
                toast.error("We couldn’t remove that just now. Please try again.");
            });
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        // Store the original order before making changes
        const originalItems = Array.from(itemsRef.current);

        // Reorder against the displayed (grouped) order so drops line up with
        // what the user actually sees.
        const oldIndex = orderedItems.findIndex((item) => item.id.toString() === active.id);
        const newIndex = orderedItems.findIndex((item) => item.id.toString() === over.id);

        if (oldIndex === -1 || newIndex === -1) {
            return;
        }

        // Don't allow dragging across the active/Done boundary — a completed
        // item always belongs in the Done section and would just snap back.
        if (orderedItems[oldIndex].is_completed !== orderedItems[newIndex].is_completed) {
            return;
        }

        const newItems = arrayMove(orderedItems, oldIndex, newIndex);

        // Optimistically update the UI (and the ref source of truth).
        applyItems(() => newItems);

        // Background XHR (no Inertia visit) so it never cancels an in-flight
        // toggle/edit/delete of another item. See handleToggleItem.
        window.axios
            .post(
                route("list-items.reorder"),
                {
                    itemIds: newItems.map((item) => item.id),
                },
                { headers: { Accept: "application/json" } }
            )
            .then(() => {
                toast.success("Items reordered.");
            })
            .catch(() => {
                // Revert to the original order on error
                applyItems(() => originalItems);
                toast.error("We couldn’t reorder that just now. Please try again.");
            });
    };

    const startEdit = (item) => {
        setEditingItem(item.id);
        setEditContent(item.content);
    };

    const cancelEdit = () => {
        setEditingItem(null);
        setEditContent("");
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Items ({items.filter((s) => s.is_completed).length}/{items.length})
                </h3>
                {canEdit && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            setIsAddingItem(true);
                        }}
                        className="text-sm text-wevie-teal hover:text-wevie-mint dark:text-wevie-mint dark:hover:text-wevie-teal flex items-center"
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Item
                    </button>
                )}
            </div>

            {isAddingItem && (
                <div className="mb-3 flex items-center space-x-2">
                    <input
                        type="text"
                        placeholder="Item name..."
                        value={newItemContent}
                        onChange={(e) => setNewItemContent(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleAddItem()}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-wevie-teal/40 focus:border-wevie-teal dark:bg-gray-700 dark:text-white"
                        autoFocus
                    />
                    <button
                        type="button"
                        onClick={handleAddItem}
                        className="p-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                    >
                        <Check className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setIsAddingItem(false);
                            setNewItemContent("");
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {items.length === 0 ? (
                <div className="py-8 text-center">
                    <Circle className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        No items yet. Add one to get started.
                    </p>
                </div>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={orderedItems.map((s) => s.id.toString())}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-2">
                            {orderedItems.map((item, index) => (
                                <div key={item.id}>
                                    {/* Divider before the first completed row */}
                                    {item.is_completed && index === activeItems.length && (
                                        <div
                                            className={`text-xs font-medium text-gray-500 dark:text-gray-400 pt-2 pb-1 ${
                                                activeItems.length > 0
                                                    ? "mt-2 border-t border-gray-200 dark:border-gray-600"
                                                    : ""
                                            }`}
                                        >
                                            Done ({doneItems.length})
                                        </div>
                                    )}
                                    <SortableItem
                                        item={item}
                                        canEdit={canEdit}
                                        editingItem={editingItem}
                                        editContent={editContent}
                                        onToggle={handleToggleItem}
                                        onStartEdit={startEdit}
                                        onEditContentChange={setEditContent}
                                        onSaveEdit={handleEditItem}
                                        onCancelEdit={cancelEdit}
                                        onDelete={handleDeleteItem}
                                        isLoading={loadingItems.has(item.id)}
                                        isDeleting={deletingItems.has(item.id)}
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

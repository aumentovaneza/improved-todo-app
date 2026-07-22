import { useEffect, useMemo, useState } from "react";
import { router } from "@inertiajs/react";
import { toast } from "react-toastify";
import { Switch } from "@headlessui/react";
import { GripVertical, X } from "lucide-react";
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
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Modal from "@/Components/Modal";

const SIZE_LABELS = { sm: "S", md: "M", lg: "L" };

/**
 * Merge the server's available widgets with the ordered layout into a single
 * editable list. Anything in `availableWidgets` but missing from the layout is
 * appended (disabled) so users can still enable it.
 */
function buildRows(availableWidgets, widgetLayout) {
    const available = availableWidgets ?? [];
    const layout = widgetLayout ?? [];
    const byKey = new Map(available.map((w) => [w.key, w]));
    const seen = new Set();
    const rows = [];

    layout.forEach((item) => {
        const meta = byKey.get(item.key);
        if (!meta) return;
        seen.add(item.key);
        rows.push({
            key: item.key,
            title: meta.title,
            allowedSizes: meta.allowedSizes?.length > 0 ? meta.allowedSizes : ["sm", "md", "lg"],
            size: item.size ?? meta.defaultSize ?? "md",
            enabled: item.enabled ?? true,
        });
    });

    available.forEach((meta) => {
        if (seen.has(meta.key)) return;
        rows.push({
            key: meta.key,
            title: meta.title,
            allowedSizes: meta.allowedSizes?.length > 0 ? meta.allowedSizes : ["sm", "md", "lg"],
            size: meta.defaultSize ?? "md",
            enabled: false,
        });
    });

    return rows;
}

function SortableRow({ row, onToggle, onSize }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: row.key,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
    };

    return (
        <li
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-3 rounded-xl border border-light-border/70 bg-light-card px-3 py-2.5 dark:border-dark-border/70 dark:bg-dark-card ${
                isDragging ? "shadow-soft" : ""
            }`}
        >
            <button
                type="button"
                {...attributes}
                {...listeners}
                aria-label={`Reorder ${row.title}`}
                className="flex-shrink-0 cursor-grab touch-none rounded-md p-1 text-light-muted transition-colors hover:bg-light-hover hover:text-light-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-wevie-teal/40 active:cursor-grabbing dark:text-dark-muted dark:hover:bg-dark-hover"
            >
                <GripVertical className="h-4 w-4" aria-hidden="true" />
            </button>

            <span className="min-w-0 flex-1 truncate text-sm font-medium text-adaptive-primary">
                {row.title}
            </span>

            <div
                className="flex flex-shrink-0 items-center gap-0.5 rounded-lg bg-light-hover p-0.5 dark:bg-dark-hover"
                role="group"
                aria-label={`${row.title} size`}
            >
                {["sm", "md", "lg"].map((size) => {
                    const allowed = row.allowedSizes.includes(size);
                    if (!allowed) return null;
                    const active = row.size === size;
                    return (
                        <button
                            key={size}
                            type="button"
                            onClick={() => onSize(row.key, size)}
                            disabled={!row.enabled}
                            aria-pressed={active}
                            className={`h-7 w-7 rounded-md text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-wevie-teal/40 disabled:opacity-40 ${
                                active
                                    ? "bg-white text-wevie-teal shadow-soft dark:bg-dark-secondary"
                                    : "text-adaptive-muted hover:text-adaptive-primary"
                            }`}
                        >
                            {SIZE_LABELS[size]}
                        </button>
                    );
                })}
            </div>

            <Switch
                checked={row.enabled}
                onChange={() => onToggle(row.key)}
                className={`${
                    row.enabled
                        ? "bg-gradient-to-r from-wevie-teal to-wevie-mint"
                        : "bg-light-border dark:bg-dark-border"
                } relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-wevie-teal/40`}
            >
                <span className="sr-only">
                    {row.enabled ? "Hide" : "Show"} {row.title}
                </span>
                <span
                    className={`${
                        row.enabled ? "translate-x-6" : "translate-x-1"
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
            </Switch>
        </li>
    );
}

/**
 * Customize modal: toggle widgets on/off, pick each widget's size (limited to
 * its allowedSizes), and drag to reorder. Save persists the full layout;
 * Cancel discards local edits by resetting from props.
 */
export default function CustomizeDashboardModal({
    show,
    onClose,
    availableWidgets = [],
    widgetLayout = [],
    onSaved,
}) {
    const initialRows = useMemo(
        () => buildRows(availableWidgets, widgetLayout),
        [availableWidgets, widgetLayout]
    );
    const [rows, setRows] = useState(initialRows);
    const [saving, setSaving] = useState(false);

    // Re-seed local edits whenever the modal (re)opens or the source changes.
    useEffect(() => {
        if (show) {
            setRows(buildRows(availableWidgets, widgetLayout));
        }
    }, [show, availableWidgets, widgetLayout]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const toggle = (key) =>
        setRows((prev) =>
            prev.map((row) => (row.key === key ? { ...row, enabled: !row.enabled } : row))
        );

    const setSize = (key, size) =>
        setRows((prev) => prev.map((row) => (row.key === key ? { ...row, size } : row)));

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        setRows((prev) => {
            const oldIndex = prev.findIndex((r) => r.key === active.id);
            const newIndex = prev.findIndex((r) => r.key === over.id);
            if (oldIndex === -1 || newIndex === -1) return prev;
            return arrayMove(prev, oldIndex, newIndex);
        });
    };

    const save = () => {
        const widgets = rows.map((row) => ({
            key: row.key,
            size: row.size,
            enabled: row.enabled,
        }));
        setSaving(true);
        router.post(
            route("dashboard.layout.update"),
            { widgets },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    if (onSaved) onSaved(widgets);
                    toast.success("Dashboard layout saved.");
                    onClose();
                },
                onError: () => {
                    toast.error("We couldn’t save your layout just now. Please try again.");
                },
                onFinish: () => setSaving(false),
            }
        );
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="2xl" alignTop>
            <div className="flex items-center justify-between border-b border-light-border/70 px-5 py-4 dark:border-dark-border/70">
                <div>
                    <h2 className="text-lg font-semibold text-adaptive-primary">
                        Customize dashboard
                    </h2>
                    <p className="mt-0.5 text-sm text-adaptive-muted">
                        Toggle widgets, set their size, and drag to reorder.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="rounded-md p-1 text-light-muted transition-colors hover:bg-light-hover hover:text-light-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-wevie-teal/40 dark:text-dark-muted dark:hover:bg-dark-hover"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
                {rows.length === 0 ? (
                    <p className="py-8 text-center text-sm text-adaptive-muted">
                        No widgets available to customize.
                    </p>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={rows.map((r) => r.key)}
                            strategy={verticalListSortingStrategy}
                        >
                            <ul className="space-y-2">
                                {rows.map((row) => (
                                    <SortableRow
                                        key={row.key}
                                        row={row}
                                        onToggle={toggle}
                                        onSize={setSize}
                                    />
                                ))}
                            </ul>
                        </SortableContext>
                    </DndContext>
                )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-light-border/70 px-5 py-4 dark:border-dark-border/70">
                <button type="button" onClick={onClose} className="btn-secondary" disabled={saving}>
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={save}
                    className="btn-primary disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={saving}
                >
                    {saving ? "Saving…" : "Save changes"}
                </button>
            </div>
        </Modal>
    );
}

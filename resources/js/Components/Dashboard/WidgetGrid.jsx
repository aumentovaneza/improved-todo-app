import { useState } from "react";
import { LayoutGrid, GripVertical } from "lucide-react";
import {
    DndContext,
    DragOverlay,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    rectSortingStrategy,
    sortableKeyboardCoordinates,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import EmptyState from "@/Components/Finance/UI/EmptyState";
import { getWidget, getColSpanClass } from "@/widgets/registry";

function SortableWidget({ item, data }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: item.key,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    const entry = getWidget(item.key);
    if (!entry) return null;

    const { Component, selfContained, title } = entry;
    const dragHandleProps = { ...attributes, ...listeners };
    const colSpan = getColSpanClass(item.size);

    return (
        <div ref={setNodeRef} style={style} className={`${colSpan} ${isDragging ? "z-10" : ""}`}>
            {selfContained ? (
                // Widgets that render their own card (Weather) get an overlaid
                // handle instead of one inside a shared WidgetFrame header.
                <div className="relative h-full">
                    <button
                        type="button"
                        {...dragHandleProps}
                        aria-label={`Drag to reorder ${title}`}
                        className="absolute left-3 top-3 z-10 hidden cursor-grab touch-none rounded-md bg-white/20 p-1 text-white backdrop-blur-sm transition-colors hover:bg-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 active:cursor-grabbing sm:block"
                    >
                        <GripVertical className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <Component data={data} />
                </div>
            ) : (
                <Component data={data} dragHandleProps={dragHandleProps} />
            )}
        </div>
    );
}

/**
 * The customizable widget grid. Renders only enabled widgets in layout order.
 * Dragging reorders local state optimistically and calls `onReorder` with the
 * full reordered layout so the parent can persist it.
 */
export default function WidgetGrid({ layout = [], widgetData = {}, onReorder }) {
    const [activeKey, setActiveKey] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const visible = layout.filter((item) => item.enabled && getWidget(item.key));

    const handleDragStart = (event) => setActiveKey(event.active.id);

    const handleDragEnd = (event) => {
        setActiveKey(null);
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = layout.findIndex((i) => i.key === active.id);
        const newIndex = layout.findIndex((i) => i.key === over.id);
        if (oldIndex === -1 || newIndex === -1) return;

        onReorder?.(arrayMove(layout, oldIndex, newIndex));
    };

    if (visible.length === 0) {
        return (
            <EmptyState
                icon={LayoutGrid}
                title="No widgets on your dashboard"
                description="Use Customize to switch some widgets on and arrange them your way."
            />
        );
    }

    const activeEntry = activeKey ? getWidget(activeKey) : null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveKey(null)}
        >
            <SortableContext items={visible.map((item) => item.key)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
                    {visible.map((item) => (
                        <SortableWidget key={item.key} item={item} data={widgetData[item.key]} />
                    ))}
                </div>
            </SortableContext>

            <DragOverlay>
                {activeEntry ? (
                    <div className="card flex items-center gap-2 px-4 py-3 shadow-soft">
                        <GripVertical className="h-4 w-4 text-adaptive-muted" aria-hidden="true" />
                        <span className="text-sm font-semibold text-adaptive-primary">
                            {activeEntry.title}
                        </span>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

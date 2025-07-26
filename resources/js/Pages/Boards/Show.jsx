import TodoLayout from "@/Layouts/TodoLayout";
import { Head, Link, useForm, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
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
    Users,
    ArrowLeft,
    Settings,
    MoreVertical,
    Calendar,
    User,
    Flag,
    GripVertical,
    Edit,
    Trash2,
    UserPlus,
    X,
} from "lucide-react";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import Modal from "@/Components/Modal";
import TaskEditModal from "@/Components/TaskEditModal";
import TextInput from "@/Components/TextInput";
import InputLabel from "@/Components/InputLabel";
import InputError from "@/Components/InputError";
import { toast } from "react-toastify";

function SortableTask({ task, swimlaneId, onTaskClick, currentUser }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: `task-${task.id}`,
        data: {
            type: "task",
            task,
            swimlaneId,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case "urgent":
                return "text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200";
            case "high":
                return "text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-200";
            case "medium":
                return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200";
            case "low":
                return "text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200";
            default:
                return "text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200";
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-3 hover:shadow-md transition-shadow cursor-pointer ${
                isDragging ? "shadow-lg z-10" : ""
            }`}
            onClick={() => onTaskClick && onTaskClick(task)}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {task.title}
                    </h4>
                    {task.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                            {task.description}
                        </p>
                    )}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                                    task.priority
                                )}`}
                            >
                                <Flag className="h-3 w-3 mr-1" />
                                {task.priority}
                            </span>
                            {task.due_date && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    <Calendar className="h-3 w-3 inline mr-1" />
                                    {new Date(
                                        task.due_date
                                    ).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center space-x-1">
                            {task.user && (
                                <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                        task.user.id === currentUser.id
                                            ? "bg-green-600"
                                            : "bg-blue-600"
                                    }`}
                                    title={`Assigned to: ${task.user.name}${
                                        task.user.id === currentUser.id
                                            ? " (You)"
                                            : ""
                                    }`}
                                >
                                    <span className="text-white text-xs font-medium">
                                        {task.user.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div
                    {...attributes}
                    {...listeners}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                    title="Drag to reorder"
                >
                    <GripVertical className="h-4 w-4" />
                </div>
            </div>
        </div>
    );
}

function SwimlaneColumn({ swimlane, tasks, onTaskClick, currentUser }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: `swimlane-${swimlane.id}`,
        data: {
            type: "swimlane",
            swimlane,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-gray-50 dark:bg-gray-900 rounded-lg p-4 w-full flex flex-col h-full`}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: swimlane.color }}
                    />
                    <h3 className="font-medium text-gray-900 dark:text-white">
                        {swimlane.name}
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        ({tasks.length})
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto mb-4">
                <SortableContext
                    items={tasks.map((task) => `task-${task.id}`)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-3">
                        {tasks.map((task) => (
                            <SortableTask
                                key={task.id}
                                task={task}
                                swimlaneId={swimlane.id}
                                onTaskClick={onTaskClick}
                                currentUser={currentUser}
                            />
                        ))}
                    </div>
                </SortableContext>
            </div>
        </div>
    );
}

export default function Show({ workspace, board, isOrganizer, isBoardAdmin }) {
    const { auth } = usePage().props;
    const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
    const [showCollaboratorsModal, setShowCollaboratorsModal] = useState(false);
    const [showEditTaskModal, setShowEditTaskModal] = useState(false);
    const [selectedSwimlane, setSelectedSwimlane] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null);
    const [activeId, setActiveId] = useState(null);
    const [activeTask, setActiveTask] = useState(null);

    const createTaskForm = useForm({
        title: "",
        description: "",
        priority: "medium",
        swimlane_id: "",
        due_date: "",
        assigned_to: "",
    });

    const addCollaboratorForm = useForm({
        email: "",
        role: "collaborator",
    });

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleCreateTask = (e) => {
        e.preventDefault();
        createTaskForm.post(
            route("boards.tasks.store", [workspace.id, board.id]),
            {
                onSuccess: () => {
                    setShowCreateTaskModal(false);
                    createTaskForm.reset();
                    setSelectedSwimlane(null);
                    toast.success("Task created successfully!");
                },
            }
        );
    };

    const openCreateTaskModal = (swimlane) => {
        setSelectedSwimlane(swimlane);
        createTaskForm.setData("swimlane_id", swimlane.id);
        setShowCreateTaskModal(true);
    };

    const openTaskEditModal = (task) => {
        setSelectedTask(task);
        setShowEditTaskModal(true);
    };

    const closeTaskEditModal = () => {
        setSelectedTask(null);
        setShowEditTaskModal(false);
    };

    const handleAddCollaborator = (e) => {
        e.preventDefault();
        addCollaboratorForm.post(
            route("boards.collaborators.store", [workspace.id, board.id]),
            {
                onSuccess: () => {
                    addCollaboratorForm.reset();
                    toast.success("Collaborator added successfully!");
                },
            }
        );
    };

    const handleRemoveCollaborator = (userId) => {
        if (confirm("Are you sure you want to remove this collaborator?")) {
            useForm().delete(
                route("boards.collaborators.destroy", [
                    workspace.id,
                    board.id,
                    userId,
                ]),
                {
                    onSuccess: () => {
                        toast.success("Collaborator removed successfully!");
                    },
                }
            );
        }
    };

    const handleDragStart = (event) => {
        const { active } = event;
        setActiveId(active.id);

        if (active.data.current?.type === "task") {
            setActiveTask(active.data.current.task);
        }
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveId(null);
        setActiveTask(null);

        if (!over) return;

        const activeData = active.data.current;
        const overData = over.data.current;

        if (activeData?.type === "task") {
            const task = activeData.task;
            const sourceSwimlaneId = activeData.swimlaneId;

            let targetSwimlaneId;
            let newPosition;

            if (overData?.type === "task") {
                // Dropped on another task
                targetSwimlaneId = overData.swimlaneId;
                newPosition = overData.task.position;
            } else if (overData?.type === "swimlane") {
                // Dropped on a swimlane
                targetSwimlaneId = overData.swimlane.id;
                // Find the last position in this swimlane
                const swimlaneTasks =
                    board.swimlanes.find((s) => s.id === targetSwimlaneId)
                        ?.tasks || [];
                newPosition = swimlaneTasks.length;
            } else {
                return;
            }

            // Only move if position or swimlane changed
            if (
                sourceSwimlaneId !== targetSwimlaneId ||
                task.position !== newPosition
            ) {
                router.post(
                    route("boards.move-task", [workspace.id, board.id]),
                    {
                        taskId: task.id,
                        targetSwimlaneId: targetSwimlaneId,
                        newPosition: newPosition,
                    },
                    {
                        preserveScroll: true,
                        preserveState: false, // Allow state refresh to show updated positions
                        onSuccess: () => {
                            toast.success("Task moved successfully!");
                        },
                        onError: () => {
                            toast.error("Failed to move task");
                        },
                    }
                );
            }
        }
    };

    return (
        <TodoLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link
                            href={route("workspaces.show", workspace.id)}
                            className="p-2 text-light-muted hover:text-light-secondary dark:text-dark-muted dark:hover:text-dark-secondary"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h2 className="font-semibold text-xl text-light-primary dark:text-dark-primary leading-tight">
                                {board.name}
                            </h2>
                            <p className="text-sm text-light-secondary dark:text-dark-secondary">
                                {workspace.name}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <SecondaryButton
                            onClick={() => setShowCollaboratorsModal(true)}
                        >
                            <Users className="h-4 w-4 mr-2" />
                            Collaborators ({board.collaborators?.length || 0})
                        </SecondaryButton>
                    </div>
                </div>
            }
        >
            <Head title={`${board.name} - ${workspace.name}`} />

            <div className="py-6">
                <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="flex space-x-6 pb-6 h-[80vh] overflow-x-auto">
                            <SortableContext
                                items={
                                    board.swimlanes?.map(
                                        (s) => `swimlane-${s.id}`
                                    ) || []
                                }
                            >
                                {board.swimlanes?.map((swimlane) => (
                                    <div
                                        key={swimlane.id}
                                        className="h-full flex flex-col flex-shrink-0 w-80"
                                    >
                                        <SwimlaneColumn
                                            swimlane={swimlane}
                                            tasks={swimlane.tasks || []}
                                            onTaskClick={openTaskEditModal}
                                            currentUser={auth.user}
                                        />
                                        <div className="p-4 pt-0">
                                            <button
                                                onClick={() =>
                                                    openCreateTaskModal(
                                                        swimlane
                                                    )
                                                }
                                                className="w-full flex items-center justify-center p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white dark:hover:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 transition-colors"
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add Task
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </SortableContext>
                        </div>

                        <DragOverlay>
                            {activeTask ? (
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 w-80 transform rotate-3">
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                        {activeTask.title}
                                    </h4>
                                    {activeTask.description && (
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                                            {activeTask.description}
                                        </p>
                                    )}
                                </div>
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                </div>
            </div>

            {/* Create Task Modal */}
            <Modal
                show={showCreateTaskModal}
                onClose={() => setShowCreateTaskModal(false)}
            >
                <form onSubmit={handleCreateTask} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        Create New Task
                        {selectedSwimlane && (
                            <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-2">
                                in {selectedSwimlane.name}
                            </span>
                        )}
                    </h2>

                    <div className="mb-4">
                        <InputLabel htmlFor="task_title" value="Task Title" />
                        <TextInput
                            id="task_title"
                            type="text"
                            className="mt-1 block w-full"
                            value={createTaskForm.data.title}
                            onChange={(e) =>
                                createTaskForm.setData("title", e.target.value)
                            }
                            required
                        />
                        <InputError
                            message={createTaskForm.errors.title}
                            className="mt-2"
                        />
                    </div>

                    <div className="mb-4">
                        <InputLabel
                            htmlFor="task_description"
                            value="Description (Optional)"
                        />
                        <textarea
                            id="task_description"
                            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                            rows="3"
                            value={createTaskForm.data.description}
                            onChange={(e) =>
                                createTaskForm.setData(
                                    "description",
                                    e.target.value
                                )
                            }
                        />
                        <InputError
                            message={createTaskForm.errors.description}
                            className="mt-2"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <InputLabel
                                htmlFor="task_priority"
                                value="Priority"
                            />
                            <select
                                id="task_priority"
                                className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                value={createTaskForm.data.priority}
                                onChange={(e) =>
                                    createTaskForm.setData(
                                        "priority",
                                        e.target.value
                                    )
                                }
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                            <InputError
                                message={createTaskForm.errors.priority}
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="task_due_date"
                                value="Due Date (Optional)"
                            />
                            <TextInput
                                id="task_due_date"
                                type="date"
                                className="mt-1 block w-full"
                                value={createTaskForm.data.due_date}
                                onChange={(e) =>
                                    createTaskForm.setData(
                                        "due_date",
                                        e.target.value
                                    )
                                }
                            />
                            <InputError
                                message={createTaskForm.errors.due_date}
                                className="mt-2"
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <InputLabel
                            htmlFor="task_assigned_to"
                            value="Assign To (Optional)"
                        />
                        <select
                            id="task_assigned_to"
                            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                            value={createTaskForm.data.assigned_to}
                            onChange={(e) =>
                                createTaskForm.setData(
                                    "assigned_to",
                                    e.target.value
                                )
                            }
                        >
                            <option value="">Unassigned</option>
                            <option value={workspace.organizer.id}>
                                {workspace.organizer.name} (Organizer)
                            </option>
                            {board.collaborators?.map((collaborator) => (
                                <option
                                    key={collaborator.id}
                                    value={collaborator.id}
                                >
                                    {collaborator.name} (
                                    {collaborator.pivot.role})
                                </option>
                            ))}
                        </select>
                        <InputError
                            message={createTaskForm.errors.assigned_to}
                            className="mt-2"
                        />
                    </div>

                    <div className="flex justify-end space-x-3">
                        <SecondaryButton
                            type="button"
                            onClick={() => setShowCreateTaskModal(false)}
                        >
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton
                            type="submit"
                            disabled={createTaskForm.processing}
                        >
                            {createTaskForm.processing
                                ? "Creating..."
                                : "Create Task"}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Board Collaborators Modal */}
            <Modal
                show={showCollaboratorsModal}
                onClose={() => setShowCollaboratorsModal(false)}
                maxWidth="2xl"
            >
                <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        Board Collaborators
                    </h2>

                    {/* Workspace Organizer */}
                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Workspace Organizer
                        </h3>
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm font-medium">
                                        {workspace.organizer.name
                                            .charAt(0)
                                            .toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {workspace.organizer.name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {workspace.organizer.email}
                                    </p>
                                </div>
                            </div>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                Organizer
                            </span>
                        </div>
                    </div>

                    {/* Board Collaborators */}
                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Board Collaborators (
                            {board.collaborators?.length || 0})
                        </h3>
                        {board.collaborators &&
                        board.collaborators.length > 0 ? (
                            <div className="space-y-2">
                                {board.collaborators.map((collaborator) => (
                                    <div
                                        key={collaborator.id}
                                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                                                <span className="text-white text-sm font-medium">
                                                    {collaborator.name
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {collaborator.name}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {collaborator.email}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                                                {collaborator.pivot.role}
                                            </span>
                                            {isOrganizer && (
                                                <button
                                                    onClick={() =>
                                                        handleRemoveCollaborator(
                                                            collaborator.id
                                                        )
                                                    }
                                                    className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                                    title="Remove collaborator"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                No collaborators on this board yet.
                            </p>
                        )}
                    </div>

                    {/* Add Board Collaborator Form */}
                    {isOrganizer && (
                        <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                Add Board Collaborator
                            </h3>
                            <form
                                onSubmit={handleAddCollaborator}
                                className="space-y-4"
                            >
                                <div>
                                    <InputLabel
                                        htmlFor="collaborator_email"
                                        value="Email Address"
                                    />
                                    <TextInput
                                        id="collaborator_email"
                                        type="email"
                                        className="mt-1 block w-full"
                                        value={addCollaboratorForm.data.email}
                                        onChange={(e) =>
                                            addCollaboratorForm.setData(
                                                "email",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Enter email address"
                                        required
                                    />
                                    <InputError
                                        message={
                                            addCollaboratorForm.errors.email
                                        }
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor="collaborator_role"
                                        value="Role"
                                    />
                                    <select
                                        id="collaborator_role"
                                        className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                        value={addCollaboratorForm.data.role}
                                        onChange={(e) =>
                                            addCollaboratorForm.setData(
                                                "role",
                                                e.target.value
                                            )
                                        }
                                    >
                                        <option value="collaborator">
                                            Collaborator
                                        </option>
                                        <option value="admin">Admin</option>
                                    </select>
                                    <InputError
                                        message={
                                            addCollaboratorForm.errors.role
                                        }
                                        className="mt-2"
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <PrimaryButton
                                        type="submit"
                                        disabled={
                                            addCollaboratorForm.processing
                                        }
                                    >
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        {addCollaboratorForm.processing
                                            ? "Adding..."
                                            : "Add Collaborator"}
                                    </PrimaryButton>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Task Edit Modal */}
            <TaskEditModal
                show={showEditTaskModal}
                onClose={closeTaskEditModal}
                task={selectedTask}
                workspace={workspace}
                board={board}
                onTaskUpdate={() => {
                    // Refresh the page to show updated task data
                    router.reload({ only: ["board"] });
                    closeTaskEditModal();
                }}
            />
        </TodoLayout>
    );
}

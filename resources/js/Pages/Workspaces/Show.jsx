import TodoLayout from "@/Layouts/TodoLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { useState } from "react";
import {
    Plus,
    Users,
    FolderOpen,
    Calendar,
    Settings,
    Trash2,
    Edit,
    ArrowLeft,
    Mail,
    UserPlus,
    X,
} from "lucide-react";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import DangerButton from "@/Components/DangerButton";
import Modal from "@/Components/Modal";
import TextInput from "@/Components/TextInput";
import InputLabel from "@/Components/InputLabel";
import InputError from "@/Components/InputError";
import { toast } from "react-toastify";

export default function Show({ workspace, isOrganizer }) {
    const [showCreateBoardModal, setShowCreateBoardModal] = useState(false);
    const [showEditWorkspaceModal, setShowEditWorkspaceModal] = useState(false);
    const [showCollaboratorsModal, setShowCollaboratorsModal] = useState(false);

    const createBoardForm = useForm({
        name: "",
        description: "",
    });

    const editWorkspaceForm = useForm({
        name: workspace.name,
        description: workspace.description || "",
    });

    const addCollaboratorForm = useForm({
        email: "",
        role: "collaborator",
    });

    const handleCreateBoard = (e) => {
        e.preventDefault();
        createBoardForm.post(route("boards.store", workspace.id), {
            onSuccess: () => {
                setShowCreateBoardModal(false);
                createBoardForm.reset();
                toast.success("Board created successfully!");
            },
        });
    };

    const handleEditWorkspace = (e) => {
        e.preventDefault();
        editWorkspaceForm.put(route("workspaces.update", workspace.id), {
            onSuccess: () => {
                setShowEditWorkspaceModal(false);
                toast.success("Workspace updated successfully!");
            },
        });
    };

    const handleAddCollaborator = (e) => {
        e.preventDefault();
        addCollaboratorForm.post(
            route("workspaces.collaborators.store", workspace.id),
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
                route("workspaces.collaborators.destroy", [
                    workspace.id,
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

    const BoardCard = ({ board }) => (
        <div className="card overflow-hidden transition-shadow hover:shadow-md">
            <div className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {board.name}
                        </h3>
                        {board.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                {board.description}
                            </p>
                        )}
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Created{" "}
                            {new Date(board.created_at).toLocaleDateString()}
                        </div>
                    </div>
                </div>
                <div className="mt-4">
                    <Link
                        href={route("boards.show", [workspace.id, board.id])}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                    >
                        Open Board
                    </Link>
                </div>
            </div>
        </div>
    );

    return (
        <TodoLayout
            header={
                <div className="flex items-center space-x-4 justify-between">
                    <div className="flex items-center space-x-4">
                        <Link
                            href={route("workspaces.index")}
                            className="p-2 text-light-muted hover:text-light-secondary dark:text-dark-muted dark:hover:text-dark-secondary"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h2 className="font-semibold text-xl text-light-primary dark:text-dark-primary leading-tight">
                                {workspace.name}
                            </h2>
                            {workspace.description && (
                                <p className="text-sm text-light-secondary dark:text-dark-secondary">
                                    {workspace.description}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <SecondaryButton
                            onClick={() => setShowCollaboratorsModal(true)}
                        >
                            <Users className="h-4 w-4 mr-2" />
                            Collaborators (
                            {workspace.collaborators?.length || 0})
                        </SecondaryButton>
                        {isOrganizer && (
                            <>
                                <SecondaryButton
                                    onClick={() =>
                                        setShowEditWorkspaceModal(true)
                                    }
                                >
                                    <Settings className="h-4 w-4 mr-2" />
                                    Settings
                                </SecondaryButton>
                                <PrimaryButton
                                    onClick={() =>
                                        setShowCreateBoardModal(true)
                                    }
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    New Board
                                </PrimaryButton>
                            </>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={workspace.name} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {workspace.boards && workspace.boards.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {workspace.boards.map((board) => (
                                <BoardCard key={board.id} board={board} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
                                No boards yet
                            </h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Get started by creating your first board.
                            </p>
                            {isOrganizer && (
                                <div className="mt-6">
                                    <PrimaryButton
                                        onClick={() =>
                                            setShowCreateBoardModal(true)
                                        }
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create First Board
                                    </PrimaryButton>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Board Modal */}
            <Modal
                show={showCreateBoardModal}
                onClose={() => setShowCreateBoardModal(false)}
            >
                <form onSubmit={handleCreateBoard} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        Create New Board
                    </h2>

                    <div className="mb-4">
                        <InputLabel htmlFor="board_name" value="Board Name" />
                        <TextInput
                            id="board_name"
                            type="text"
                            className="mt-1 block w-full"
                            value={createBoardForm.data.name}
                            onChange={(e) =>
                                createBoardForm.setData("name", e.target.value)
                            }
                            required
                        />
                        <InputError
                            message={createBoardForm.errors.name}
                            className="mt-2"
                        />
                    </div>

                    <div className="mb-6">
                        <InputLabel
                            htmlFor="board_description"
                            value="Description (Optional)"
                        />
                        <textarea
                            id="board_description"
                            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                            rows="3"
                            value={createBoardForm.data.description}
                            onChange={(e) =>
                                createBoardForm.setData(
                                    "description",
                                    e.target.value
                                )
                            }
                        />
                        <InputError
                            message={createBoardForm.errors.description}
                            className="mt-2"
                        />
                    </div>

                    <div className="flex justify-end space-x-3">
                        <SecondaryButton
                            type="button"
                            onClick={() => setShowCreateBoardModal(false)}
                        >
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton
                            type="submit"
                            disabled={createBoardForm.processing}
                        >
                            {createBoardForm.processing
                                ? "Creating..."
                                : "Create Board"}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Edit Workspace Modal */}
            <Modal
                show={showEditWorkspaceModal}
                onClose={() => setShowEditWorkspaceModal(false)}
            >
                <form onSubmit={handleEditWorkspace} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        Workspace Settings
                    </h2>

                    <div className="mb-4">
                        <InputLabel
                            htmlFor="workspace_name"
                            value="Workspace Name"
                        />
                        <TextInput
                            id="workspace_name"
                            type="text"
                            className="mt-1 block w-full"
                            value={editWorkspaceForm.data.name}
                            onChange={(e) =>
                                editWorkspaceForm.setData(
                                    "name",
                                    e.target.value
                                )
                            }
                            required
                        />
                        <InputError
                            message={editWorkspaceForm.errors.name}
                            className="mt-2"
                        />
                    </div>

                    <div className="mb-6">
                        <InputLabel
                            htmlFor="workspace_description"
                            value="Description (Optional)"
                        />
                        <textarea
                            id="workspace_description"
                            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                            rows="3"
                            value={editWorkspaceForm.data.description}
                            onChange={(e) =>
                                editWorkspaceForm.setData(
                                    "description",
                                    e.target.value
                                )
                            }
                        />
                        <InputError
                            message={editWorkspaceForm.errors.description}
                            className="mt-2"
                        />
                    </div>

                    <div className="flex justify-end space-x-3">
                        <SecondaryButton
                            type="button"
                            onClick={() => setShowEditWorkspaceModal(false)}
                        >
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton
                            type="submit"
                            disabled={editWorkspaceForm.processing}
                        >
                            {editWorkspaceForm.processing
                                ? "Updating..."
                                : "Update Workspace"}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Collaborators Modal */}
            <Modal
                show={showCollaboratorsModal}
                onClose={() => setShowCollaboratorsModal(false)}
                maxWidth="2xl"
            >
                <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        Workspace Collaborators
                    </h2>

                    {/* Organizer */}
                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Organizer
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

                    {/* Collaborators */}
                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Collaborators (
                            {workspace.collaborators?.length || 0})
                        </h3>
                        {workspace.collaborators &&
                        workspace.collaborators.length > 0 ? (
                            <div className="space-y-2">
                                {workspace.collaborators.map((collaborator) => (
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
                                No collaborators yet.
                            </p>
                        )}
                    </div>

                    {/* Add Collaborator Form */}
                    {isOrganizer && (
                        <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                Add Collaborator
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
        </TodoLayout>
    );
}

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
} from "lucide-react";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import DangerButton from "@/Components/DangerButton";
import Modal from "@/Components/Modal";
import TextInput from "@/Components/TextInput";
import InputLabel from "@/Components/InputLabel";
import InputError from "@/Components/InputError";
import { toast } from "react-toastify";

export default function Index({
    organizedWorkspaces,
    collaboratingWorkspaces,
}) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingWorkspace, setEditingWorkspace] = useState(null);

    const createForm = useForm({
        name: "",
        description: "",
    });

    const editForm = useForm({
        name: "",
        description: "",
    });

    const handleCreateSubmit = (e) => {
        e.preventDefault();
        createForm.post(route("workspaces.store"), {
            onSuccess: () => {
                setShowCreateModal(false);
                createForm.reset();
                toast.success("Workspace created successfully!");
            },
        });
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        editForm.put(route("workspaces.update", editingWorkspace.id), {
            onSuccess: () => {
                setShowEditModal(false);
                setEditingWorkspace(null);
                editForm.reset();
                toast.success("Workspace updated successfully!");
            },
        });
    };

    const openEditModal = (workspace) => {
        setEditingWorkspace(workspace);
        editForm.setData({
            name: workspace.name,
            description: workspace.description || "",
        });
        setShowEditModal(true);
    };

    const handleDelete = (workspace) => {
        if (
            confirm(
                "Are you sure you want to delete this workspace? This action cannot be undone."
            )
        ) {
            useForm().delete(route("workspaces.destroy", workspace.id), {
                onSuccess: () => {
                    toast.success("Workspace deleted successfully!");
                },
            });
        }
    };

    const WorkspaceCard = ({ workspace, isOrganizer }) => (
        <div className="card overflow-hidden transition-shadow hover:shadow-md">
            <div className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                            <FolderOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {workspace.name}
                            </h3>
                            {isOrganizer && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                    Organizer
                                </span>
                            )}
                        </div>
                        {workspace.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                {workspace.description}
                            </p>
                        )}
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center space-x-1">
                                <FolderOpen className="h-4 w-4" />
                                <span>
                                    {workspace.boards?.length || 0} boards
                                </span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>
                                    Created{" "}
                                    {new Date(
                                        workspace.created_at
                                    ).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                        {isOrganizer && (
                            <>
                                <button
                                    onClick={() => openEditModal(workspace)}
                                    className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                    title="Edit workspace"
                                >
                                    <Edit className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(workspace)}
                                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                    title="Delete workspace"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </>
                        )}
                    </div>
                </div>
                <div className="mt-4 flex justify-between items-center">
                    <Link
                        href={route("workspaces.show", workspace.id)}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                    >
                        Open Workspace
                    </Link>
                </div>
            </div>
        </div>
    );

    return (
        <TodoLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
                    <h2 className="font-semibold text-xl text-light-primary dark:text-dark-primary leading-tight">
                        Workspaces
                    </h2>
                    <PrimaryButton onClick={() => setShowCreateModal(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Workspace
                    </PrimaryButton>
                </div>
            }
        >
            <Head title="Workspaces" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Organized Workspaces */}
                    <div className="mb-8">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                            Your Workspaces
                        </h3>
                        {organizedWorkspaces.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {organizedWorkspaces.map((workspace) => (
                                    <WorkspaceCard
                                        key={workspace.id}
                                        workspace={workspace}
                                        isOrganizer={true}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                                    No workspaces
                                </h3>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Get started by creating a new workspace.
                                </p>
                                <div className="mt-6">
                                    <PrimaryButton
                                        onClick={() => setShowCreateModal(true)}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        New Workspace
                                    </PrimaryButton>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Collaborating Workspaces */}
                    {collaboratingWorkspaces.length > 0 && (
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                Shared with You
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {collaboratingWorkspaces.map((workspace) => (
                                    <WorkspaceCard
                                        key={workspace.id}
                                        workspace={workspace}
                                        isOrganizer={false}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Workspace Modal */}
            <Modal
                show={showCreateModal}
                onClose={() => setShowCreateModal(false)}
            >
                <form onSubmit={handleCreateSubmit} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        Create New Workspace
                    </h2>

                    <div className="mb-4">
                        <InputLabel htmlFor="name" value="Workspace Name" />
                        <TextInput
                            id="name"
                            type="text"
                            className="mt-1 block w-full"
                            value={createForm.data.name}
                            onChange={(e) =>
                                createForm.setData("name", e.target.value)
                            }
                            required
                        />
                        <InputError
                            message={createForm.errors.name}
                            className="mt-2"
                        />
                    </div>

                    <div className="mb-6">
                        <InputLabel
                            htmlFor="description"
                            value="Description (Optional)"
                        />
                        <textarea
                            id="description"
                            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                            rows="3"
                            value={createForm.data.description}
                            onChange={(e) =>
                                createForm.setData(
                                    "description",
                                    e.target.value
                                )
                            }
                        />
                        <InputError
                            message={createForm.errors.description}
                            className="mt-2"
                        />
                    </div>

                    <div className="flex justify-end space-x-3">
                        <SecondaryButton
                            type="button"
                            onClick={() => setShowCreateModal(false)}
                        >
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton
                            type="submit"
                            disabled={createForm.processing}
                        >
                            {createForm.processing
                                ? "Creating..."
                                : "Create Workspace"}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Edit Workspace Modal */}
            <Modal show={showEditModal} onClose={() => setShowEditModal(false)}>
                <form onSubmit={handleEditSubmit} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        Edit Workspace
                    </h2>

                    <div className="mb-4">
                        <InputLabel
                            htmlFor="edit_name"
                            value="Workspace Name"
                        />
                        <TextInput
                            id="edit_name"
                            type="text"
                            className="mt-1 block w-full"
                            value={editForm.data.name}
                            onChange={(e) =>
                                editForm.setData("name", e.target.value)
                            }
                            required
                        />
                        <InputError
                            message={editForm.errors.name}
                            className="mt-2"
                        />
                    </div>

                    <div className="mb-6">
                        <InputLabel
                            htmlFor="edit_description"
                            value="Description (Optional)"
                        />
                        <textarea
                            id="edit_description"
                            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                            rows="3"
                            value={editForm.data.description}
                            onChange={(e) =>
                                editForm.setData("description", e.target.value)
                            }
                        />
                        <InputError
                            message={editForm.errors.description}
                            className="mt-2"
                        />
                    </div>

                    <div className="flex justify-end space-x-3">
                        <SecondaryButton
                            type="button"
                            onClick={() => setShowEditModal(false)}
                        >
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton
                            type="submit"
                            disabled={editForm.processing}
                        >
                            {editForm.processing
                                ? "Updating..."
                                : "Update Workspace"}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </TodoLayout>
    );
}

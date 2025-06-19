import { useState } from "react";
import { router } from "@inertiajs/react";
import { X, Plus } from "lucide-react";
import Modal from "@/Components/Modal";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import TextInput from "@/Components/TextInput";
import InputLabel from "@/Components/InputLabel";
import InputError from "@/Components/InputError";
import { toast } from "react-toastify";

export default function QuickSubtaskModal({ show, onClose, task }) {
    const [subtaskTitle, setSubtaskTitle] = useState("");
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!subtaskTitle.trim()) {
            setErrors({ title: "Subtask title is required" });
            return;
        }

        setProcessing(true);
        setErrors({});

        router.post(
            route("subtasks.store"),
            {
                task_id: task?.id,
                title: subtaskTitle.trim(),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Subtask added successfully!");
                    setSubtaskTitle("");
                    onClose();
                },
                onError: (errors) => {
                    setErrors(errors);
                    toast.error("Failed to add subtask");
                },
                onFinish: () => {
                    setProcessing(false);
                },
            }
        );
    };

    const handleClose = () => {
        setSubtaskTitle("");
        setErrors({});
        onClose();
    };

    return (
        <Modal show={show} onClose={handleClose} maxWidth="md">
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Add Subtask
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {task && (
                    <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Adding subtask to:
                        </p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                            {task.title}
                        </p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <InputLabel
                            htmlFor="subtask_title"
                            value="Subtask Title"
                        />
                        <TextInput
                            id="subtask_title"
                            type="text"
                            className="mt-1 block w-full"
                            value={subtaskTitle}
                            onChange={(e) => setSubtaskTitle(e.target.value)}
                            placeholder="Enter subtask title..."
                            autoFocus
                        />
                        <InputError message={errors.title} className="mt-2" />
                    </div>

                    <div className="flex items-center justify-end space-x-3 pt-4">
                        <SecondaryButton
                            onClick={handleClose}
                            disabled={processing}
                        >
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton
                            disabled={processing || !subtaskTitle.trim()}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            {processing ? "Adding..." : "Add Subtask"}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </Modal>
    );
}

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
            setErrors({ title: "Please add a short title." });
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
                    toast.success("Subtask saved.");
                    setSubtaskTitle("");
                    onClose();
                },
                onError: (errors) => {
                    setErrors(errors);
                    toast.error(
                        "We couldn’t save that just now. Try again when you’re ready."
                    );
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
                    <h2 className="text-lg font-semibold text-light-primary dark:text-dark-primary">
                        Add a subtask
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-light-muted hover:text-light-secondary dark:text-dark-muted dark:hover:text-dark-secondary"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {task && (
                    <div className="mb-4 p-3 bg-light-hover dark:bg-dark-hover rounded-xl">
                        <p className="text-sm text-light-muted dark:text-dark-muted">
                            Adding to:
                        </p>
                        <p className="font-medium text-light-primary dark:text-dark-primary">
                            {task.title}
                        </p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <InputLabel
                            htmlFor="subtask_title"
                            value="Title"
                        />
                        <TextInput
                            id="subtask_title"
                            type="text"
                            className="mt-1 block w-full"
                            value={subtaskTitle}
                            onChange={(e) => setSubtaskTitle(e.target.value)}
                            placeholder="What’s a gentle next step?"
                            autoFocus
                        />
                        <InputError message={errors.title} className="mt-2" />
                    </div>

                    <div className="flex items-center justify-end space-x-3 pt-4">
                        <SecondaryButton
                            onClick={handleClose}
                            disabled={processing}
                        >
                            Not now
                        </SecondaryButton>
                        <PrimaryButton
                            disabled={processing || !subtaskTitle.trim()}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            {processing ? "Saving..." : "Save subtask"}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </Modal>
    );
}

import { useForm, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import Modal from "./Modal";
import SecondaryButton from "./SecondaryButton";
import PrimaryButton from "./PrimaryButton";

export default function TaskModal({ show, onClose, onSubmitting }) {
    const { categories } = usePage().props;
    const [isSubmitting, setIsSubmitting] = useState(false);

    const initialFormData = {
        title: "",
        description: "",
        category_id: "",
        priority: "medium",
        due_date: "",
    };

    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm(initialFormData);

    // Force complete form reset when modal opens
    useEffect(() => {
        if (show) {
            // Force reset all form fields manually
            setData({
                title: "",
                description: "",
                category_id: "",
                priority: "medium",
                due_date: "",
            });
            clearErrors();
            setIsSubmitting(false);
        }
    }, [show]);

    // Notify parent about submission state
    useEffect(() => {
        if (onSubmitting) {
            onSubmitting(processing || isSubmitting);
        }
    }, [processing, isSubmitting, onSubmitting]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        post(route("tasks.store"), {
            onSuccess: () => {
                // Force complete form reset
                setData({
                    title: "",
                    description: "",
                    category_id: "",
                    priority: "medium",
                    due_date: "",
                });
                clearErrors();
                setIsSubmitting(false);
                onClose();
            },
            onError: () => {
                // Keep form data on error so user doesn't lose their input
                setIsSubmitting(false);
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleClose = () => {
        // Force complete form reset
        setData({
            title: "",
            description: "",
            category_id: "",
            priority: "medium",
            due_date: "",
        });
        clearErrors();
        setIsSubmitting(false);
        onClose();
    };

    return (
        <Modal show={show} onClose={handleClose} maxWidth="2xl">
            <div className="max-h-[70vh] overflow-y-auto">
                <form onSubmit={handleSubmit} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                        Create New Task
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Title
                            </label>
                            <input
                                type="text"
                                className="w-full rounded border-gray-300 dark:bg-gray-700 dark:text-gray-100"
                                value={data.title}
                                onChange={(e) =>
                                    setData("title", e.target.value)
                                }
                                required
                            />
                            {errors.title && (
                                <div className="text-red-500 text-xs mt-1">
                                    {errors.title}
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Description
                            </label>
                            <textarea
                                className="w-full rounded border-gray-300 dark:bg-gray-700 dark:text-gray-100"
                                value={data.description}
                                onChange={(e) =>
                                    setData("description", e.target.value)
                                }
                            />
                            {errors.description && (
                                <div className="text-red-500 text-xs mt-1">
                                    {errors.description}
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Category
                            </label>
                            <select
                                className="w-full rounded border-gray-300 dark:bg-gray-700 dark:text-gray-100"
                                value={data.category_id}
                                onChange={(e) =>
                                    setData("category_id", e.target.value)
                                }
                            >
                                <option value="">Select category</option>
                                {categories &&
                                    categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                            </select>
                            {errors.category_id && (
                                <div className="text-red-500 text-xs mt-1">
                                    {errors.category_id}
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Priority
                            </label>
                            <select
                                className="w-full rounded border-gray-300 dark:bg-gray-700 dark:text-gray-100"
                                value={data.priority}
                                onChange={(e) =>
                                    setData("priority", e.target.value)
                                }
                            >
                                <option value="urgent">Urgent</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Due Date
                            </label>
                            <input
                                type="date"
                                className="w-full rounded border-gray-300 dark:bg-gray-700 dark:text-gray-100"
                                value={data.due_date}
                                onChange={(e) =>
                                    setData("due_date", e.target.value)
                                }
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={handleClose}>
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton
                            type="submit"
                            disabled={processing || isSubmitting}
                        >
                            {processing || isSubmitting
                                ? "Creating..."
                                : "Create Task"}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </Modal>
    );
}

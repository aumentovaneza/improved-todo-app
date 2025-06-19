import { useForm } from "@inertiajs/react";
import Modal from "./Modal";
import SecondaryButton from "./SecondaryButton";
import PrimaryButton from "./PrimaryButton";
import SubtaskManager from "./SubtaskManager";
import { useEffect } from "react";

export default function TaskEditModal({ show, onClose, task, categories }) {
    const { data, setData, put, processing, errors, reset } = useForm({
        title: "",
        description: "",
        category_id: "",
        priority: "medium",
        status: "pending",
        due_date: "",
        is_recurring: false,
        recurrence_type: "",
        recurrence_config: {},
    });

    useEffect(() => {
        if (task) {
            setData({
                title: task.title || "",
                description: task.description || "",
                category_id: task.category_id || "",
                priority: task.priority || "medium",
                status: task.status || "pending",
                due_date: task.due_date || "",
                is_recurring: task.is_recurring || false,
                recurrence_type: task.recurrence_type || "",
                recurrence_config: task.recurrence_config || {},
            });
        }
    }, [task]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!task) return;

        put(route("tasks.update", task.id), {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="2xl">
            <div className="max-h-[70vh] overflow-y-auto">
                <form onSubmit={handleSubmit} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                        Edit Task
                    </h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column - Task Details */}
                        <div className="space-y-4 lg:order-1">
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
                                    rows={3}
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

                            <div className="grid grid-cols-2 gap-4">
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
                                        Status
                                    </label>
                                    <select
                                        className="w-full rounded border-gray-300 dark:bg-gray-700 dark:text-gray-100"
                                        value={data.status}
                                        onChange={(e) =>
                                            setData("status", e.target.value)
                                        }
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="in_progress">
                                            In Progress
                                        </option>
                                        <option value="completed">
                                            Completed
                                        </option>
                                        <option value="cancelled">
                                            Cancelled
                                        </option>
                                    </select>
                                </div>
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

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="is_recurring"
                                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500"
                                    checked={data.is_recurring}
                                    onChange={(e) =>
                                        setData(
                                            "is_recurring",
                                            e.target.checked
                                        )
                                    }
                                />
                                <label
                                    htmlFor="is_recurring"
                                    className="ml-2 block text-sm text-gray-900 dark:text-gray-100"
                                >
                                    Recurring Task
                                </label>
                            </div>

                            {data.is_recurring && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Recurrence Type
                                    </label>
                                    <select
                                        className="w-full rounded border-gray-300 dark:bg-gray-700 dark:text-gray-100"
                                        value={data.recurrence_type}
                                        onChange={(e) =>
                                            setData(
                                                "recurrence_type",
                                                e.target.value
                                            )
                                        }
                                    >
                                        <option value="">Select type</option>
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="yearly">Yearly</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Right Column - Subtasks */}
                        <div className="border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 pt-6 lg:pt-0 lg:pl-6 lg:order-2">
                            {task && (
                                <SubtaskManager
                                    task={task}
                                    subtasks={task.subtasks || []}
                                    canEdit={true}
                                />
                            )}
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={onClose}>
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton type="submit" disabled={processing}>
                            Update Task
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </Modal>
    );
}

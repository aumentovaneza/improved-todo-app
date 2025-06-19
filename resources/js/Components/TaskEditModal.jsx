import { useForm } from "@inertiajs/react";
import Modal from "./Modal";
import SecondaryButton from "./SecondaryButton";
import PrimaryButton from "./PrimaryButton";
import SubtaskManager from "./SubtaskManager";
import TagInput from "./TagInput";
import CategoryTagSelector from "./CategoryTagSelector";
import { useEffect } from "react";

export default function TaskEditModal({
    show,
    onClose,
    task,
    categories,
    onTaskUpdate,
}) {
    const { data, setData, put, processing, errors, reset } = useForm({
        title: "",
        description: "",
        category_id: "",
        priority: "medium",
        status: "pending",
        due_date: "",
        start_time: "",
        end_time: "",
        is_all_day: true,
        is_recurring: false,
        recurrence_type: "",
        recurrence_config: {},
        recurring_until: "",
        tags: [],
    });

    useEffect(() => {
        if (task) {
            setData({
                title: task.title || "",
                description: task.description || "",
                category_id: task.category_id || "",
                priority: task.priority || "medium",
                status: task.status || "pending",
                due_date: task.due_date
                    ? new Date(task.due_date).toISOString().split("T")[0]
                    : "",
                start_time: task.start_time
                    ? task.start_time.includes("T") ||
                      task.start_time.includes(" ")
                        ? new Date(task.start_time).toTimeString().slice(0, 5)
                        : task.start_time.slice(0, 5)
                    : "",
                end_time: task.end_time
                    ? task.end_time.includes("T") || task.end_time.includes(" ")
                        ? new Date(task.end_time).toTimeString().slice(0, 5)
                        : task.end_time.slice(0, 5)
                    : "",
                is_all_day:
                    task.is_all_day !== undefined ? task.is_all_day : true,
                is_recurring: task.is_recurring || false,
                recurrence_type: task.recurrence_type || "",
                recurrence_config: task.recurrence_config || {},
                recurring_until: task.recurring_until
                    ? new Date(task.recurring_until).toISOString().split("T")[0]
                    : "",
                tags: task.tags
                    ? task.tags.map((tag) => ({
                          ...tag,
                          is_new: false,
                      }))
                    : [],
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

                            <CategoryTagSelector
                                categoryId={data.category_id}
                                categories={categories}
                                selectedTags={data.tags}
                                onChange={(tags) => setData("tags", tags)}
                            />

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Add Custom Tags (Optional)
                                </label>
                                <TagInput
                                    value={data.tags}
                                    onChange={(tags) => setData("tags", tags)}
                                    placeholder="Type tag names and press space or comma to add..."
                                    maxTags={5}
                                />
                                {errors.tags && (
                                    <div className="text-red-500 text-xs mt-1">
                                        {errors.tags}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="is_recurring_edit"
                                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500"
                                    checked={data.is_recurring}
                                    onChange={(e) => {
                                        setData(
                                            "is_recurring",
                                            e.target.checked
                                        );
                                        if (!e.target.checked) {
                                            // Clear recurring fields when switching to non-recurring
                                            setData("recurrence_type", "");
                                            setData("recurring_until", "");
                                        } else {
                                            // Clear due_date when switching to recurring
                                            setData("due_date", "");
                                        }
                                    }}
                                />
                                <label
                                    htmlFor="is_recurring_edit"
                                    className="ml-2 block text-sm text-gray-900 dark:text-gray-100"
                                >
                                    Recurring Task
                                </label>
                            </div>

                            {data.is_recurring ? (
                                <>
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
                                            required={data.is_recurring}
                                        >
                                            <option value="">
                                                Select type
                                            </option>
                                            <option value="daily">Daily</option>
                                            <option value="weekly">
                                                Weekly
                                            </option>
                                            <option value="monthly">
                                                Monthly
                                            </option>
                                            <option value="yearly">
                                                Yearly
                                            </option>
                                        </select>
                                        {errors.recurrence_type && (
                                            <div className="text-red-500 text-xs mt-1">
                                                {errors.recurrence_type}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Recurring Until
                                        </label>
                                        <input
                                            type="date"
                                            className="w-full rounded border-gray-300 dark:bg-gray-700 dark:text-gray-100"
                                            value={data.recurring_until}
                                            onChange={(e) =>
                                                setData(
                                                    "recurring_until",
                                                    e.target.value
                                                )
                                            }
                                            required={data.is_recurring}
                                        />
                                        {errors.recurring_until && (
                                            <div className="text-red-500 text-xs mt-1">
                                                {errors.recurring_until}
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
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
                                    {errors.due_date && (
                                        <div className="text-red-500 text-xs mt-1">
                                            {errors.due_date}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Time Section */}
                            {(data.due_date || data.recurring_until) && (
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="is_all_day_edit"
                                            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                            checked={data.is_all_day}
                                            onChange={(e) => {
                                                setData(
                                                    "is_all_day",
                                                    e.target.checked
                                                );
                                                if (e.target.checked) {
                                                    setData("start_time", "");
                                                    setData("end_time", "");
                                                }
                                            }}
                                        />
                                        <label
                                            htmlFor="is_all_day_edit"
                                            className="text-sm font-medium"
                                        >
                                            All day task
                                        </label>
                                    </div>

                                    {!data.is_all_day && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium mb-1">
                                                    Start Time
                                                </label>
                                                <input
                                                    type="time"
                                                    className="w-full rounded border-gray-300 dark:bg-gray-700 dark:text-gray-100"
                                                    value={data.start_time}
                                                    onChange={(e) =>
                                                        setData(
                                                            "start_time",
                                                            e.target.value
                                                        )
                                                    }
                                                    required={!data.is_all_day}
                                                />
                                                {errors.start_time && (
                                                    <div className="text-red-500 text-xs mt-1">
                                                        {errors.start_time}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">
                                                    End Time
                                                </label>
                                                <input
                                                    type="time"
                                                    className="w-full rounded border-gray-300 dark:bg-gray-700 dark:text-gray-100"
                                                    value={data.end_time}
                                                    onChange={(e) =>
                                                        setData(
                                                            "end_time",
                                                            e.target.value
                                                        )
                                                    }
                                                    required={!data.is_all_day}
                                                />
                                                {errors.end_time && (
                                                    <div className="text-red-500 text-xs mt-1">
                                                        {errors.end_time}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {errors.time && (
                                        <div className="text-red-500 text-xs mt-1">
                                            {errors.time}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Right Column - Subtasks */}
                        <div className="border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 pt-6 lg:pt-0 lg:pl-6 lg:order-2">
                            {task && (
                                <SubtaskManager
                                    key={`edit-${task.id}-${task.updated_at}`}
                                    task={task}
                                    subtasks={task.subtasks || []}
                                    canEdit={true}
                                    onTaskUpdate={onTaskUpdate}
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

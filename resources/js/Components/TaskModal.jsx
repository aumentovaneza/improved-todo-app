import { useForm, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import Modal from "./Modal";
import SecondaryButton from "./SecondaryButton";
import PrimaryButton from "./PrimaryButton";
import TagInput from "./TagInput";
import CategoryTagSelector from "./CategoryTagSelector";

export default function TaskModal({
    show,
    onClose,
    onSubmitting,
    defaultCategoryId = null,
}) {
    const { categories } = usePage().props;
    const [isSubmitting, setIsSubmitting] = useState(false);

    const initialFormData = {
        title: "",
        description: "",
        category_id: defaultCategoryId || "",
        priority: "medium",
        due_date: "",
        start_time: "",
        end_time: "",
        is_all_day: true,
        is_recurring: false,
        recurrence_type: "",
        recurring_until: "",
        tags: [],
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
                category_id: defaultCategoryId || "",
                priority: "medium",
                due_date: "",
                start_time: "",
                end_time: "",
                is_all_day: true,
                is_recurring: false,
                recurrence_type: "",
                recurring_until: "",
                tags: [],
            });
            clearErrors();
            setIsSubmitting(false);
        }
    }, [show, defaultCategoryId]);

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
                    start_time: "",
                    end_time: "",
                    is_all_day: true,
                    is_recurring: false,
                    recurrence_type: "",
                    recurring_until: "",
                    tags: [],
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
            start_time: "",
            end_time: "",
            is_all_day: true,
            is_recurring: false,
            recurrence_type: "",
            recurring_until: "",
            tags: [],
        });
        clearErrors();
        setIsSubmitting(false);
        onClose();
    };

    return (
        <Modal show={show} onClose={handleClose} maxWidth="2xl">
            <div className="max-h-[70vh] overflow-y-auto">
                <form onSubmit={handleSubmit} className="p-6">
                    <h2 className="text-lg font-medium text-light-primary dark:text-dark-primary mb-2">
                        New task
                    </h2>
                    <p className="text-sm text-light-muted dark:text-dark-muted mb-4">
                        Add what feels helpful now. Details can come later.
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-light-secondary dark:text-dark-secondary">
                                Title
                            </label>
                            <input
                                type="text"
                                className="w-full input-primary"
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
                            <label className="block text-sm font-medium mb-1 text-light-secondary dark:text-dark-secondary">
                                Notes
                            </label>
                            <textarea
                                className="w-full input-primary"
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
                            <label className="block text-sm font-medium mb-1 text-light-secondary dark:text-dark-secondary">
                                Category
                            </label>
                            <select
                                className="w-full input-primary"
                                value={data.category_id}
                                onChange={(e) =>
                                    setData("category_id", e.target.value)
                                }
                            >
                                <option value="">Choose when ready</option>
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
                            <label className="block text-sm font-medium mb-1 text-light-secondary dark:text-dark-secondary">
                                Priority
                            </label>
                            <select
                                className="w-full input-primary"
                                value={data.priority}
                                onChange={(e) =>
                                    setData("priority", e.target.value)
                                }
                            >
                                <option value="urgent">Focus</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>

                        <CategoryTagSelector
                            categoryId={data.category_id}
                            categories={categories}
                            selectedTags={data.tags}
                            onChange={(tags) => setData("tags", tags)}
                        />

                        <div>
                            <label className="block text-sm font-medium mb-1 text-light-secondary dark:text-dark-secondary">
                                Add tags (optional)
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
                                id="is_recurring"
                                className="rounded border-light-border text-wevie-teal shadow-sm focus:ring-wevie-teal/30 dark:border-dark-border dark:text-wevie-mint dark:focus:ring-wevie-mint/30"
                                checked={data.is_recurring}
                                onChange={(e) => {
                                    setData("is_recurring", e.target.checked);
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
                                htmlFor="is_recurring"
                                className="ml-2 block text-sm text-light-primary dark:text-dark-primary"
                            >
                                Repeat gently
                            </label>
                        </div>

                        {data.is_recurring ? (
                            <>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-light-secondary dark:text-dark-secondary">
                                        Repeat pattern
                                    </label>
                                    <select
                                        className="w-full input-primary"
                                        value={data.recurrence_type}
                                        onChange={(e) =>
                                            setData(
                                                "recurrence_type",
                                                e.target.value
                                            )
                                        }
                                        required={data.is_recurring}
                                    >
                                        <option value="">Choose a rhythm</option>
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="yearly">Yearly</option>
                                    </select>
                                    {errors.recurrence_type && (
                                        <div className="text-red-500 text-xs mt-1">
                                            {errors.recurrence_type}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-light-secondary dark:text-dark-secondary">
                                        Repeat until
                                    </label>
                                    <input
                                        type="date"
                                        className="w-full input-primary"
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
                                <label className="block text-sm font-medium mb-1 text-light-secondary dark:text-dark-secondary">
                                    Planned date
                                </label>
                                <input
                                    type="date"
                                    className="w-full input-primary"
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
                                        id="is_all_day"
                                        className="rounded border-light-border text-wevie-teal shadow-sm focus:border-wevie-teal focus:ring focus:ring-wevie-teal/30 dark:border-dark-border dark:text-wevie-mint"
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
                                        htmlFor="is_all_day"
                                        className="text-sm font-medium text-light-secondary dark:text-dark-secondary"
                                    >
                                        All day
                                    </label>
                                </div>

                                {!data.is_all_day && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium mb-1 text-light-secondary dark:text-dark-secondary">
                                                Start time
                                            </label>
                                            <input
                                                type="time"
                                                className="w-full input-primary"
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
                                            <label className="block text-sm font-medium mb-1 text-light-secondary dark:text-dark-secondary">
                                                End time
                                            </label>
                                            <input
                                                type="time"
                                                className="w-full input-primary"
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

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={handleClose}>
                            Not now
                        </SecondaryButton>
                        <PrimaryButton
                            type="submit"
                            disabled={processing || isSubmitting}
                        >
                            {processing || isSubmitting
                                ? "Saving..."
                                : "Save task"}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </Modal>
    );
}

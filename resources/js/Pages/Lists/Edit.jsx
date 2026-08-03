import TodoLayout from "@/Layouts/TodoLayout";
import { Head, useForm, Link } from "@inertiajs/react";
import { ArrowLeft, Save, Edit3 } from "lucide-react";

export default function Edit({ list }) {
    const { data, setData, put, processing, errors } = useForm({
        name: list.name || "",
        description: list.description || "",
        color: list.color || "#4ACF91",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route("lists.update", list.id));
    };

    const colorOptions = [
        "#4ACF91", // Wevie green
        "#5FDDE0", // Wevie cyan
        "#3B82F6", // Blue
        "#EF4444", // Red
        "#F59E0B", // Yellow
        "#8B5CF6", // Purple
        "#F97316", // Orange
        "#84CC16", // Lime
        "#EC4899", // Pink
        "#6B7280", // Gray
    ];

    return (
        <TodoLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route("lists.index")}
                            className="inline-flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
                            Edit List
                        </h2>
                    </div>
                </div>
            }
        >
            <Head title="Edit List" />
            <div className="max-w-2xl mx-auto">
                <div className="card p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${data.color}20` }}
                        >
                            <Edit3
                                className="w-5 h-5 sm:w-6 sm:h-6"
                                style={{ color: data.color }}
                            />
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100">
                                Edit "{list.name}"
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                Update list information and settings
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                List Name
                            </label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-light-border/70 dark:border-white/10 rounded-md focus:ring-wevie-teal/40 focus:border-wevie-teal dark:bg-dark-card dark:text-white text-sm sm:text-base"
                                value={data.name}
                                onChange={(e) => setData("name", e.target.value)}
                                placeholder="e.g. Grocery List"
                                required
                            />
                            {errors.name && (
                                <div className="text-red-500 text-xs mt-1">{errors.name}</div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Description (Optional)
                            </label>
                            <textarea
                                rows={3}
                                className="w-full px-3 py-2 border border-light-border/70 dark:border-white/10 rounded-md focus:ring-wevie-teal/40 focus:border-wevie-teal dark:bg-dark-card dark:text-white text-sm sm:text-base"
                                value={data.description}
                                onChange={(e) => setData("description", e.target.value)}
                                placeholder="What is this list for?"
                            />
                            {errors.description && (
                                <div className="text-red-500 text-xs mt-1">
                                    {errors.description}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                List Color
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {colorOptions.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setData("color", color)}
                                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-all duration-200 ${
                                            data.color === color
                                                ? "border-gray-900 dark:border-gray-100 scale-110"
                                                : "border-gray-300 dark:border-gray-600 hover:scale-105"
                                        }`}
                                        style={{ backgroundColor: color }}
                                        aria-label={`Select color ${color}`}
                                    />
                                ))}
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                    Selected:
                                </span>
                                <div
                                    className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600"
                                    style={{ backgroundColor: data.color }}
                                />
                                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-mono">
                                    {data.color}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <button
                                type="submit"
                                className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-wevie-teal to-wevie-mint border border-transparent text-white text-sm font-medium rounded-xl hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wevie-teal/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                disabled={processing}
                            >
                                <Save className="mr-2 h-4 w-4" />
                                {processing ? "Updating..." : "Update List"}
                            </button>
                            <Link
                                href={route("lists.index")}
                                className="inline-flex items-center justify-center px-4 py-2 border border-light-border/70 dark:border-dark-border/70 text-light-secondary dark:text-dark-secondary text-sm font-medium rounded-xl hover:bg-light-hover dark:hover:bg-dark-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wevie-teal/40 transition-colors duration-200"
                            >
                                Cancel
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </TodoLayout>
    );
}

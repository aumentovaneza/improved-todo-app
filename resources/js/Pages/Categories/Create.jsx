import TodoLayout from "@/Layouts/TodoLayout";
import { Head, useForm, Link } from "@inertiajs/react";
import { ArrowLeft, Save, FolderPlus } from "lucide-react";
import TagInput from "@/Components/TagInput";

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: "",
        description: "",
        color: "#3B82F6", // Default blue color
        tags: [],
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("categories.store"));
    };

    const colorOptions = [
        "#3B82F6", // Blue
        "#EF4444", // Red
        "#10B981", // Green
        "#F59E0B", // Yellow
        "#8B5CF6", // Purple
        "#F97316", // Orange
        "#06B6D4", // Cyan
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
                            href={route("categories.index")}
                            className="inline-flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
                            Create Category
                        </h2>
                    </div>
                </div>
            }
        >
            <Head title="Create Category" />
            <div className="max-w-2xl mx-auto">
                <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                            <FolderPlus className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100">
                                New Category
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                Create a new category to organize your tasks
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Category Name
                            </label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base"
                                value={data.name}
                                onChange={(e) =>
                                    setData("name", e.target.value)
                                }
                                placeholder="Enter category name..."
                                required
                            />
                            {errors.name && (
                                <div className="text-red-500 text-xs mt-1">
                                    {errors.name}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Description (Optional)
                            </label>
                            <textarea
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base"
                                value={data.description}
                                onChange={(e) =>
                                    setData("description", e.target.value)
                                }
                                placeholder="Enter category description..."
                            />
                            {errors.description && (
                                <div className="text-red-500 text-xs mt-1">
                                    {errors.description}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Tags (Optional)
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

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Category Color
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
                                className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                disabled={processing}
                            >
                                <Save className="mr-2 h-4 w-4" />
                                {processing ? "Creating..." : "Create Category"}
                            </button>
                            <Link
                                href={route("categories.index")}
                                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
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

import TodoLayout from "@/Layouts/TodoLayout";
import { Head, Link, usePage, router } from "@inertiajs/react";
import { Plus, Eye, Edit, FolderOpen, Trash2 } from "lucide-react";

export default function Index({ categories }) {
    const handleDelete = (category) => {
        if (
            confirm(
                `Are you sure you want to delete the category "${category.name}"? This action cannot be undone.`
            )
        ) {
            router.delete(route("categories.destroy", category.id));
        }
    };

    return (
        <TodoLayout
            header={
                <div className="flex flex-row items-center justify-between gap-2 md:gap-4">
                    <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100 flex-shrink-0">
                        Categories
                    </h2>
                    <Link
                        href={route("categories.create")}
                        className="inline-flex items-center justify-center w-auto px-3 py-2 sm:px-2 sm:py-1.5 md:px-4 md:py-2 bg-blue-600 text-white text-xs sm:text-xs md:text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                        <Plus className="mr-1 sm:mr-2 h-4 w-4 sm:h-3 sm:w-3 md:h-4 md:w-4" />
                        <span className="hidden sm:inline">New Category</span>
                        <span className="sm:hidden">Add</span>
                    </Link>
                </div>
            }
        >
            <Head title="Categories" />
            <div className="max-w-4xl mx-auto">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm divide-y divide-gray-200 dark:divide-gray-700">
                    {categories.length === 0 ? (
                        <div className="p-6 sm:p-8 text-center">
                            <div className="text-gray-400 dark:text-gray-500 mb-4">
                                <FolderOpen className="mx-auto h-10 w-10 sm:h-12 sm:w-12" />
                            </div>
                            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                                No categories found
                            </h3>
                            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4">
                                Get started by creating your first category to
                                organize your tasks.
                            </p>
                            <Link
                                href={route("categories.create")}
                                className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2.5 sm:px-4 sm:py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Create Category
                            </Link>
                        </div>
                    ) : (
                        categories.map((category) => (
                            <div
                                key={category.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span
                                            className="inline-block w-4 h-4 sm:w-5 sm:h-5 rounded-full flex-shrink-0"
                                            style={{
                                                backgroundColor: category.color,
                                            }}
                                        ></span>
                                        <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base truncate">
                                            {category.name}
                                        </span>
                                    </div>
                                    {category.description && (
                                        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 ml-7 sm:ml-8">
                                            {category.description}
                                        </div>
                                    )}
                                    <div className="text-xs text-gray-400 dark:text-gray-500 ml-7 sm:ml-8 mt-1">
                                        {category.tasks_count || 0} task
                                        {(category.tasks_count || 0) !== 1
                                            ? "s"
                                            : ""}
                                    </div>
                                </div>

                                <div className="flex items-center space-x-1 sm:space-x-2 mt-3 sm:mt-0 sm:ml-4">
                                    <Link
                                        href={route(
                                            "categories.show",
                                            category.id
                                        )}
                                        className="p-1 sm:p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Link>
                                    <Link
                                        href={route(
                                            "categories.edit",
                                            category.id
                                        )}
                                        className="p-1 sm:p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Link>

                                    <button
                                        onClick={() => handleDelete(category)}
                                        className="p-1 sm:p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </TodoLayout>
    );
}

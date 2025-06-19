import TodoLayout from "@/Layouts/TodoLayout";
import { Head, Link, usePage } from "@inertiajs/react";
import { Plus, Eye, Edit, FolderOpen } from "lucide-react";

export default function Index({ categories }) {
    return (
        <TodoLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Categories
                    </h2>
                    <Link
                        href={route("categories.create")}
                        className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        New Category
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
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
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
                                <div className="flex gap-2 mt-3 sm:mt-0 sm:ml-4">
                                    <Link
                                        href={route(
                                            "categories.show",
                                            category.id
                                        )}
                                        className="inline-flex items-center px-3 py-1.5 text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-md transition-colors duration-200"
                                    >
                                        <Eye className="mr-1 h-3 w-3" />
                                        View
                                    </Link>
                                    <Link
                                        href={route(
                                            "categories.edit",
                                            category.id
                                        )}
                                        className="inline-flex items-center px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors duration-200"
                                    >
                                        <Edit className="mr-1 h-3 w-3" />
                                        Edit
                                    </Link>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </TodoLayout>
    );
}

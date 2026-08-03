import TodoLayout from "@/Layouts/TodoLayout";
import { Head, Link, router } from "@inertiajs/react";
import { Plus, Eye, Edit, ListChecks, Trash2, CheckSquare } from "lucide-react";

export default function Index({ lists = [] }) {
    const handleDelete = (list) => {
        if (
            confirm(
                `Are you sure you want to delete the list "${list.name}"? This action cannot be undone.`
            )
        ) {
            router.delete(route("lists.destroy", list.id));
        }
    };

    return (
        <TodoLayout
            header={
                <div className="flex flex-row items-center justify-between gap-2 md:gap-4">
                    <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100 flex-shrink-0">
                        Lists
                    </h2>
                    <Link
                        href={route("lists.create")}
                        className="inline-flex items-center justify-center w-auto px-3 py-2 sm:px-2 sm:py-1.5 md:px-4 md:py-2 bg-gradient-to-r from-wevie-teal to-wevie-mint border border-transparent text-white text-xs sm:text-xs md:text-sm font-medium rounded-xl hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wevie-teal/40 transition-colors duration-200"
                    >
                        <Plus className="mr-1 sm:mr-2 h-4 w-4 sm:h-3 sm:w-3 md:h-4 md:w-4" />
                        <span className="hidden sm:inline">New List</span>
                        <span className="sm:hidden">Add</span>
                    </Link>
                </div>
            }
        >
            <Head title="Lists" />
            <div className="max-w-4xl mx-auto">
                <div className="card divide-y divide-gray-200 dark:divide-white/10">
                    {lists.length === 0 ? (
                        <div className="p-6 sm:p-8 text-center">
                            <div className="text-gray-400 dark:text-gray-500 mb-4">
                                <ListChecks className="mx-auto h-10 w-10 sm:h-12 sm:w-12" />
                            </div>
                            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                                No lists found
                            </h3>
                            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4">
                                Get started by creating your first list to collect items and group
                                related tasks.
                            </p>
                            <Link
                                href={route("lists.create")}
                                className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2.5 sm:px-4 sm:py-2 bg-gradient-to-r from-wevie-teal to-wevie-mint border border-transparent text-white text-sm font-medium rounded-xl hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wevie-teal/40 transition-colors duration-200"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Create List
                            </Link>
                        </div>
                    ) : (
                        lists.map((list) => (
                            <div
                                key={list.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span
                                            className="inline-block w-4 h-4 sm:w-5 sm:h-5 rounded-full flex-shrink-0"
                                            style={{
                                                backgroundColor: list.color,
                                            }}
                                        ></span>
                                        <Link
                                            href={route("lists.show", list.id)}
                                            className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base truncate hover:text-wevie-teal dark:hover:text-wevie-mint transition-colors"
                                        >
                                            {list.name}
                                        </Link>
                                    </div>
                                    {list.description && (
                                        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 ml-7 sm:ml-8">
                                            {list.description}
                                        </div>
                                    )}
                                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 dark:text-gray-500 ml-7 sm:ml-8 mt-1">
                                        <span className="inline-flex items-center gap-1">
                                            <ListChecks className="h-3 w-3" />
                                            {list.items_count || 0} item
                                            {(list.items_count || 0) !== 1 ? "s" : ""}
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <CheckSquare className="h-3 w-3" />
                                            {list.tasks_count || 0} task
                                            {(list.tasks_count || 0) !== 1 ? "s" : ""}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-1 sm:space-x-2 mt-3 sm:mt-0 sm:ml-4">
                                    <Link
                                        href={route("lists.show", list.id)}
                                        className="p-1 sm:p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                        title="Open list"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Link>
                                    <Link
                                        href={route("lists.edit", list.id)}
                                        className="p-1 sm:p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                        title="Edit list"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(list)}
                                        className="p-1 sm:p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                        title="Delete list"
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

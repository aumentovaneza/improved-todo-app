import TodoLayout from "@/Layouts/TodoLayout";
import { Head, Link, usePage } from "@inertiajs/react";

export default function Index({ categories }) {
    return (
        <TodoLayout header="Categories">
            <Head title="Categories" />
            <div className="max-w-3xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Categories
                    </h2>
                    <Link
                        href={route("categories.create")}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        New Category
                    </Link>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded shadow divide-y divide-gray-200 dark:divide-gray-700">
                    {categories.length === 0 && (
                        <div className="p-6 text-gray-500 dark:text-gray-400">
                            No categories found.
                        </div>
                    )}
                    {categories.map((category) => (
                        <div
                            key={category.id}
                            className="flex items-center justify-between p-4"
                        >
                            <div>
                                <div className="flex items-center gap-2">
                                    <span
                                        className="inline-block w-4 h-4 rounded"
                                        style={{
                                            backgroundColor: category.color,
                                        }}
                                    ></span>
                                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                                        {category.name}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {category.description}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Link
                                    href={route("categories.show", category.id)}
                                    className="text-blue-600 hover:underline"
                                >
                                    View
                                </Link>
                                <Link
                                    href={route("categories.edit", category.id)}
                                    className="text-gray-600 hover:underline"
                                >
                                    Edit
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </TodoLayout>
    );
}

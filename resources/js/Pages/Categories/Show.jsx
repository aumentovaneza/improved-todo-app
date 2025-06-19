import TodoLayout from "@/Layouts/TodoLayout";
import { Head, Link } from "@inertiajs/react";
import { useState } from "react";
import TaskViewModal from "@/Components/TaskViewModal";

export default function Show({ category }) {
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);

    return (
        <TodoLayout header="Category Details">
            <Head title={category.name} />
            <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-6 rounded shadow space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {category.name}
                </h2>
                <div className="text-gray-600 dark:text-gray-300 mb-2">
                    {category.description}
                </div>
                <div className="mb-2">
                    <span
                        className="px-2 py-1 rounded"
                        style={{ backgroundColor: category.color }}
                    >
                        Color: {category.color}
                    </span>
                </div>
                {category.tasks && category.tasks.length > 0 && (
                    <div>
                        <h3 className="font-semibold mb-1">
                            Tasks in this category
                        </h3>
                        <ul className="list-disc ml-6">
                            {category.tasks.map((task) => (
                                <li key={task.id}>
                                    <button
                                        onClick={() => {
                                            setSelectedTask(task);
                                            setShowViewModal(true);
                                        }}
                                        className="text-blue-600 hover:underline"
                                    >
                                        {task.title}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                <div className="mt-6 flex gap-2">
                    <Link
                        href={route("categories.edit", category.id)}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        Edit
                    </Link>
                    <Link
                        href={route("categories.index")}
                        className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                    >
                        Back to List
                    </Link>
                </div>
            </div>
            <TaskViewModal
                show={showViewModal}
                onClose={() => {
                    setShowViewModal(false);
                    setSelectedTask(null);
                }}
                task={selectedTask}
            />
        </TodoLayout>
    );
}

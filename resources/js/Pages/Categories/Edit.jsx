import TodoLayout from "@/Layouts/TodoLayout";
import { Head, useForm } from "@inertiajs/react";

export default function Edit({ category }) {
    const { data, setData, put, processing, errors } = useForm({
        name: category.name || "",
        description: category.description || "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route("categories.update", category.id));
    };

    return (
        <TodoLayout header="Edit Category">
            <Head title="Edit Category" />
            <form
                onSubmit={handleSubmit}
                className="max-w-xl mx-auto space-y-4 bg-white dark:bg-gray-800 p-6 rounded shadow"
            >
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Name
                    </label>
                    <input
                        type="text"
                        className="w-full rounded border-gray-300 dark:bg-gray-700 dark:text-gray-100"
                        value={data.name}
                        onChange={(e) => setData("name", e.target.value)}
                        required
                    />
                    {errors.name && (
                        <div className="text-red-500 text-xs mt-1">
                            {errors.name}
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
                        onChange={(e) => setData("description", e.target.value)}
                    />
                    {errors.description && (
                        <div className="text-red-500 text-xs mt-1">
                            {errors.description}
                        </div>
                    )}
                </div>
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    disabled={processing}
                >
                    Update Category
                </button>
            </form>
        </TodoLayout>
    );
}

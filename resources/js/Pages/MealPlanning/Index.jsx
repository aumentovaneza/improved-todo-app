import TodoLayout from "@/Layouts/TodoLayout";
import { Head, Link, router } from "@inertiajs/react";
import axios from "axios";
import { useState } from "react";

export default function Index({ households = [] }) {
    const [name, setName] = useState("");
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState("");
    const create = async (event) => {
        event.preventDefault();
        setProcessing(true);
        setError("");
        try {
            const { data } = await axios.post(route("meal-planning.api.households.store"), {
                name,
                country_code: "PH",
                timezone: "Asia/Manila",
                currency: "PHP",
            });
            router.visit(route("meal-planning.planner", data.data.id));
        } catch (e) {
            setError(e.response?.data?.message || "Unable to create the household.");
            setProcessing(false);
        }
    };
    return (
        <TodoLayout>
            <Head title="Meal Planning" />
            <div className="mx-auto max-w-6xl px-4 py-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Household Meal Planning
                </h1>
                <p className="mt-1 text-gray-500">
                    Shared plans, local ingredients, pantry forecasts, and individual meal diaries.
                </p>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {households.map((household) => (
                        <Link
                            key={household.id}
                            href={route("meal-planning.planner", household.id)}
                            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:border-primary-500 dark:border-gray-700 dark:bg-gray-800"
                        >
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {household.name}
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                {household.members?.length || 0} members · {household.country_code}
                            </p>
                        </Link>
                    ))}
                </div>
                <form
                    onSubmit={create}
                    className="mt-8 max-w-xl rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
                >
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                        Create a household
                    </h2>
                    <div className="mt-3 flex gap-2">
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="Household name"
                            className="min-w-0 flex-1 rounded-lg border-gray-300 dark:bg-gray-900"
                        />
                        <button
                            disabled={processing}
                            className="rounded-lg bg-primary-600 px-4 py-2 font-medium text-white"
                        >
                            Create
                        </button>
                    </div>
                    {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                </form>
            </div>
        </TodoLayout>
    );
}

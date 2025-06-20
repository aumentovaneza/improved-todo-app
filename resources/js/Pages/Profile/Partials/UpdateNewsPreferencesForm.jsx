import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import { Transition } from "@headlessui/react";
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export default function UpdateNewsPreferencesForm({ className = "" }) {
    const [newsCategory, setNewsCategory] = useState("general");
    const [processing, setProcessing] = useState(false);
    const [recentlySuccessful, setRecentlySuccessful] = useState(false);
    const [error, setError] = useState("");

    const newsCategories = [
        { value: "general", label: "General" },
        { value: "business", label: "Business" },
        { value: "entertainment", label: "Entertainment" },
        { value: "health", label: "Health" },
        { value: "science", label: "Science" },
        { value: "sports", label: "Sports" },
        { value: "technology", label: "Technology" },
    ];

    useEffect(() => {
        // Fetch current news category preference
        const fetchCurrentCategory = async () => {
            try {
                const response = await axios.get("/api/user/news-category");
                setNewsCategory(response.data.news_category || "general");
            } catch (err) {
                console.error("Failed to fetch news category:", err);
            }
        };

        fetchCurrentCategory();
    }, []);

    const submit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setError("");

        try {
            await axios.post("/api/user/news-category", {
                news_category: newsCategory,
            });

            setRecentlySuccessful(true);
            toast.success("News preferences updated successfully!");

            // Hide success message after 3 seconds
            setTimeout(() => {
                setRecentlySuccessful(false);
            }, 3000);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Failed to update news preferences"
            );
            toast.error("Failed to update news preferences");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    News Preferences
                </h2>

                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Choose your preferred news category for the dashboard news
                    widget.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <InputLabel htmlFor="news_category" value="News Category" />

                    <select
                        id="news_category"
                        className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                        value={newsCategory}
                        onChange={(e) => setNewsCategory(e.target.value)}
                        required
                    >
                        {newsCategories.map((category) => (
                            <option key={category.value} value={category.value}>
                                {category.label}
                            </option>
                        ))}
                    </select>

                    <InputError className="mt-2" message={error} />

                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        This will change the type of news articles shown in your
                        dashboard widget.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>
                        {processing ? "Saving..." : "Save Preferences"}
                    </PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Saved.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}

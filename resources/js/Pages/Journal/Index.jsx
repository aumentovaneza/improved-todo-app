import TodoLayout from "@/Layouts/TodoLayout";
import EntriesList from "@/Components/Journal/EntriesList";
import { Head, Link, router } from "@inertiajs/react";
import { Plus, Search, X } from "lucide-react";
import { useState } from "react";

export default function Index({ entries, tags = [], moods = [], filters = {} }) {
    const [form, setForm] = useState({
        search: filters.search ?? "",
        mood: filters.mood ?? "",
        tag_id: filters.tag_id ?? "",
        date: filters.date ?? "",
    });

    const applyFilters = (next) => {
        const merged = { ...form, ...next };
        setForm(merged);
        const params = {};
        Object.entries(merged).forEach(([key, value]) => {
            if (value !== "" && value !== null && value !== undefined) {
                params[key] = value;
            }
        });
        router.get(route("journal.index"), params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        applyFilters({});
    };

    const clearFilters = () => {
        setForm({ search: "", mood: "", tag_id: "", date: "" });
        router.get(
            route("journal.index"),
            {},
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    const hasActiveFilters = form.search || form.mood || form.tag_id || form.date;

    return (
        <TodoLayout header="Journal">
            <Head title="Journal" />
            <div className="mx-auto max-w-6xl space-y-6" data-tour="journal-index">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-light-primary dark:text-dark-primary">
                            Journal
                        </h1>
                        <p className="text-sm text-light-secondary dark:text-dark-secondary">
                            Capture dated entries with formatting, moods, and tags.
                        </p>
                    </div>
                    <Link
                        href={route("journal.create")}
                        className="btn-primary inline-flex w-full items-center justify-center sm:w-auto"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        New Entry
                    </Link>
                </div>

                <div className="card p-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <form
                            onSubmit={handleSearchSubmit}
                            className="relative sm:col-span-2 lg:col-span-1"
                        >
                            <Search
                                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-light-muted dark:text-dark-muted"
                                aria-hidden="true"
                            />
                            <input
                                type="search"
                                value={form.search}
                                onChange={(e) => setForm({ ...form, search: e.target.value })}
                                placeholder="Search entries…"
                                aria-label="Search entries"
                                className="input-primary w-full rounded-xl py-2 pl-9 pr-3 text-sm"
                            />
                        </form>

                        <div>
                            <label htmlFor="filter-mood" className="sr-only">
                                Filter by mood
                            </label>
                            <select
                                id="filter-mood"
                                value={form.mood}
                                onChange={(e) => applyFilters({ mood: e.target.value })}
                                className="input-primary w-full rounded-xl py-2 text-sm"
                            >
                                <option value="">All moods</option>
                                {moods.map((mood) => (
                                    <option key={mood.value} value={mood.value}>
                                        {mood.emoji} {mood.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="filter-tag" className="sr-only">
                                Filter by tag
                            </label>
                            <select
                                id="filter-tag"
                                value={form.tag_id}
                                onChange={(e) => applyFilters({ tag_id: e.target.value })}
                                className="input-primary w-full rounded-xl py-2 text-sm"
                            >
                                <option value="">All tags</option>
                                {tags.map((tag) => (
                                    <option key={tag.id} value={tag.id}>
                                        {tag.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <label htmlFor="filter-date" className="sr-only">
                                Filter by date
                            </label>
                            <input
                                id="filter-date"
                                type="date"
                                value={form.date}
                                onChange={(e) => applyFilters({ date: e.target.value })}
                                className="input-primary w-full rounded-xl py-2 text-sm"
                            />
                        </div>
                    </div>

                    {hasActiveFilters && (
                        <div className="mt-3 flex justify-end">
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="inline-flex items-center gap-1 text-sm font-medium text-light-secondary hover:text-light-primary dark:text-dark-secondary dark:hover:text-dark-primary"
                            >
                                <X className="h-4 w-4" />
                                Clear filters
                            </button>
                        </div>
                    )}
                </div>

                <EntriesList entries={entries} moods={moods} />
            </div>
        </TodoLayout>
    );
}

import TodoLayout from "@/Layouts/TodoLayout";
import JournalContentViewer from "@/Components/Journal/JournalContentViewer";
import { Head, Link, router } from "@inertiajs/react";
import { format, parseISO } from "date-fns";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";

function formatEntryDate(dateStr) {
    if (!dateStr) return "";
    try {
        return format(parseISO(dateStr), "EEEE, MMMM d, yyyy");
    } catch {
        return dateStr;
    }
}

export default function Show({ entry, moods = [] }) {
    const mood = entry.mood
        ? (moods.find((m) => m.value === entry.mood) ?? {
              value: entry.mood,
              label: entry.mood,
              emoji: "",
          })
        : null;

    const handleDelete = () => {
        if (
            confirm(
                `Are you sure you want to delete "${entry.title || "this entry"}"? This action cannot be undone.`
            )
        ) {
            router.delete(route("journal.destroy", entry.id));
        }
    };

    return (
        <TodoLayout header="Journal Entry">
            <Head title={entry.title || "Journal Entry"} />
            <div className="mx-auto max-w-3xl space-y-6">
                <div className="flex items-center justify-between gap-3">
                    <Link
                        href={route("journal.index")}
                        className="inline-flex items-center gap-1 text-sm font-medium text-light-secondary hover:text-light-primary dark:text-dark-secondary dark:hover:text-dark-primary"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to journal
                    </Link>
                    <div className="flex items-center gap-2">
                        <Link
                            href={route("journal.edit", entry.id)}
                            className="btn-secondary inline-flex items-center"
                        >
                            <Pencil className="mr-1.5 h-4 w-4" />
                            Edit
                        </Link>
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="inline-flex items-center rounded-xl border border-error-500/40 px-4 py-2 text-sm font-medium text-error-600 transition-colors duration-200 hover:bg-error-50 focus:outline-none focus:ring-2 focus:ring-error-500/40 dark:border-error-400/40 dark:text-error-400 dark:hover:bg-error-900/20"
                        >
                            <Trash2 className="mr-1.5 h-4 w-4" />
                            Delete
                        </button>
                    </div>
                </div>

                <article className="card p-5 sm:p-8">
                    <header className="mb-6 border-b border-light-border/70 pb-5 dark:border-dark-border/70">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <time className="text-xs font-medium uppercase tracking-wide text-light-muted dark:text-dark-muted">
                                    {formatEntryDate(entry.entry_date)}
                                </time>
                                <h1 className="mt-1 text-2xl font-bold text-light-primary dark:text-dark-primary">
                                    {entry.title || "Untitled entry"}
                                </h1>
                            </div>
                            {mood && (
                                <span
                                    className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                                    title={mood.label}
                                >
                                    {mood.emoji && (
                                        <span className="text-lg leading-none" aria-hidden="true">
                                            {mood.emoji}
                                        </span>
                                    )}
                                    {mood.label}
                                </span>
                            )}
                        </div>

                        {entry.tags && entry.tags.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                                {entry.tags.map((tag) => (
                                    <span
                                        key={tag.id ?? tag.name}
                                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-light-secondary dark:text-dark-secondary"
                                        style={{
                                            backgroundColor: `${tag.color || "#6FD9D3"}22`,
                                        }}
                                    >
                                        <span
                                            className="h-1.5 w-1.5 rounded-full"
                                            style={{
                                                backgroundColor: tag.color || "#6FD9D3",
                                            }}
                                            aria-hidden="true"
                                        />
                                        {tag.name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </header>

                    <JournalContentViewer content={entry.content} />
                </article>
            </div>
        </TodoLayout>
    );
}

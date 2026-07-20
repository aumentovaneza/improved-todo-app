import { Link } from "@inertiajs/react";
import { format, parseISO } from "date-fns";

function formatEntryDate(dateStr) {
    if (!dateStr) return "";
    try {
        return format(parseISO(dateStr), "EEE, MMM d, yyyy");
    } catch {
        return dateStr;
    }
}

export default function EntryCard({ entry, moodMap = {} }) {
    const mood = entry.mood ? moodMap[entry.mood] : null;

    return (
        <Link
            href={route("journal.show", entry.id)}
            className="card-hover group flex h-full flex-col p-4 focus:outline-none focus:ring-2 focus:ring-wevie-teal/40"
        >
            <div className="flex items-start justify-between gap-2">
                <time className="text-xs font-medium uppercase tracking-wide text-light-muted dark:text-dark-muted">
                    {formatEntryDate(entry.entry_date)}
                </time>
                {mood && (
                    <span
                        className="text-xl leading-none"
                        title={mood.label}
                        aria-label={`Mood: ${mood.label}`}
                    >
                        {mood.emoji}
                    </span>
                )}
            </div>

            <h3 className="mt-2 line-clamp-2 text-base font-semibold text-light-primary group-hover:text-wevie-teal dark:text-dark-primary">
                {entry.title || "Untitled entry"}
            </h3>

            {entry.excerpt && (
                <p className="mt-1 line-clamp-3 text-sm text-light-secondary dark:text-dark-secondary">
                    {entry.excerpt}
                </p>
            )}

            {entry.tags && entry.tags.length > 0 && (
                <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
                    {entry.tags.map((tag) => (
                        <span
                            key={tag.id ?? tag.name}
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-light-secondary dark:text-dark-secondary"
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
        </Link>
    );
}

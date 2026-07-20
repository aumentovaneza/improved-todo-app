import { Link } from "@inertiajs/react";
import { BookOpen } from "lucide-react";
import EntryCard from "@/Components/Journal/EntryCard";

function Pagination({ links }) {
    if (!links || links.length <= 3) return null;
    return (
        <nav
            className="mt-6 flex flex-wrap items-center justify-center gap-1"
            aria-label="Pagination"
        >
            {links.map((link, index) => {
                const label = link.label.replace("&laquo;", "«").replace("&raquo;", "»");
                const base =
                    "inline-flex min-w-[38px] items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150";
                if (!link.url) {
                    return (
                        <span
                            key={index}
                            className={`${base} cursor-default text-light-muted dark:text-dark-muted`}
                            dangerouslySetInnerHTML={{ __html: label }}
                        />
                    );
                }
                return (
                    <Link
                        key={index}
                        href={link.url}
                        preserveScroll
                        preserveState
                        aria-current={link.active ? "page" : undefined}
                        className={`${base} ${
                            link.active
                                ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                                : "text-light-secondary hover:bg-light-hover hover:text-light-primary dark:text-dark-secondary dark:hover:bg-dark-hover dark:hover:text-dark-primary"
                        }`}
                        dangerouslySetInnerHTML={{ __html: label }}
                    />
                );
            })}
        </nav>
    );
}

export default function EntriesList({ entries, moods = [] }) {
    const data = entries?.data ?? [];
    const links = entries?.links ?? entries?.meta?.links ?? null;

    const moodMap = moods.reduce((acc, m) => {
        acc[m.value] = m;
        return acc;
    }, {});

    if (data.length === 0) {
        return (
            <div className="card flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300">
                    <BookOpen className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-semibold text-light-primary dark:text-dark-primary">
                    No entries yet
                </h3>
                <p className="max-w-sm text-sm text-light-secondary dark:text-dark-secondary">
                    Start capturing your thoughts, moods, and moments. Your journal entries will
                    appear here.
                </p>
                <Link href={route("journal.create")} className="btn-primary mt-2">
                    Write your first entry
                </Link>
            </div>
        );
    }

    return (
        <div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {data.map((entry) => (
                    <EntryCard key={entry.id} entry={entry} moodMap={moodMap} />
                ))}
            </div>
            <Pagination links={links} />
        </div>
    );
}

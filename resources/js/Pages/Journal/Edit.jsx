import TodoLayout from "@/Layouts/TodoLayout";
import JournalEntryForm from "@/Components/Journal/JournalEntryForm";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft } from "lucide-react";

export default function Edit({ entry, tags = [], moods = [] }) {
    return (
        <TodoLayout header="Edit Journal Entry">
            <Head title="Edit Journal Entry" />
            <div className="mx-auto max-w-3xl space-y-6">
                <Link
                    href={route("journal.show", entry.id)}
                    className="inline-flex items-center gap-1 text-sm font-medium text-light-secondary hover:text-light-primary dark:text-dark-secondary dark:hover:text-dark-primary"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to entry
                </Link>

                <div className="card p-4 sm:p-6">
                    <h1 className="mb-4 text-lg font-semibold text-light-primary dark:text-dark-primary">
                        Edit entry
                    </h1>
                    <JournalEntryForm entry={entry} tags={tags} moods={moods} />
                </div>
            </div>
        </TodoLayout>
    );
}

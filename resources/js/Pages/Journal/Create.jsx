import TodoLayout from "@/Layouts/TodoLayout";
import JournalEntryForm from "@/Components/Journal/JournalEntryForm";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft } from "lucide-react";

export default function Create({ tags = [], moods = [] }) {
    return (
        <TodoLayout header="New Journal Entry">
            <Head title="New Journal Entry" />
            <div className="mx-auto max-w-3xl space-y-6">
                <Link
                    href={route("journal.index")}
                    className="inline-flex items-center gap-1 text-sm font-medium text-light-secondary hover:text-light-primary dark:text-dark-secondary dark:hover:text-dark-primary"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to journal
                </Link>

                <div className="card p-4 sm:p-6">
                    <h1 className="mb-4 text-lg font-semibold text-light-primary dark:text-dark-primary">
                        New entry
                    </h1>
                    <JournalEntryForm tags={tags} moods={moods} />
                </div>
            </div>
        </TodoLayout>
    );
}

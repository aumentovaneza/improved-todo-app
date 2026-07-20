import { Link, useForm } from "@inertiajs/react";
import { format } from "date-fns";
import InputLabel from "@/Components/InputLabel";
import InputError from "@/Components/InputError";
import TextInput from "@/Components/TextInput";
import PrimaryButton from "@/Components/PrimaryButton";
import JournalEditor from "@/Components/Journal/JournalEditor";
import MoodPicker from "@/Components/Journal/MoodPicker";
import TagInput from "@/Components/Journal/TagInput";

const today = () => format(new Date(), "yyyy-MM-dd");

export default function JournalEntryForm({ entry = null, tags = [], moods = [] }) {
    const isEdit = Boolean(entry?.id);

    const form = useForm({
        entry_date: entry?.entry_date ?? today(),
        title: entry?.title ?? "",
        content: entry?.content ?? null,
        mood: entry?.mood ?? null,
        tags: (entry?.tags ?? []).map((t) => t.name),
    });

    const { data, setData, errors, processing } = form;

    const submit = (e) => {
        e.preventDefault();
        const options = { preserveScroll: true };
        if (isEdit) {
            form.put(route("journal.update", entry.id), options);
        } else {
            form.post(route("journal.store"), options);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                    <InputLabel htmlFor="title" value="Title" />
                    <TextInput
                        id="title"
                        type="text"
                        className="mt-1 block w-full"
                        value={data.title}
                        onChange={(e) => setData("title", e.target.value)}
                        placeholder="Give your entry a title"
                        required
                        isFocused
                    />
                    <InputError message={errors.title} className="mt-1" />
                </div>
                <div>
                    <InputLabel htmlFor="entry_date" value="Date" />
                    <TextInput
                        id="entry_date"
                        type="date"
                        className="mt-1 block w-full"
                        value={data.entry_date}
                        onChange={(e) => setData("entry_date", e.target.value)}
                        required
                    />
                    <InputError message={errors.entry_date} className="mt-1" />
                </div>
            </div>

            <div>
                <InputLabel value="How are you feeling?" className="mb-2" />
                <MoodPicker
                    moods={moods}
                    value={data.mood}
                    onChange={(value) => setData("mood", value)}
                />
                <InputError message={errors.mood} className="mt-1" />
            </div>

            <div>
                <InputLabel value="Tags" className="mb-2" />
                <TagInput
                    value={data.tags}
                    onChange={(value) => setData("tags", value)}
                    suggestions={tags}
                />
                <InputError message={errors.tags} className="mt-1" />
            </div>

            <div>
                <InputLabel value="Entry" className="mb-2" />
                <JournalEditor
                    content={data.content}
                    onChange={(json) => setData("content", json)}
                />
                <InputError message={errors.content} className="mt-1" />
            </div>

            <div className="flex items-center justify-end gap-3">
                <Link
                    href={isEdit ? route("journal.show", entry.id) : route("journal.index")}
                    className="btn-secondary"
                >
                    Cancel
                </Link>
                <PrimaryButton disabled={processing}>
                    {processing ? "Saving…" : isEdit ? "Update entry" : "Save entry"}
                </PrimaryButton>
            </div>
        </form>
    );
}

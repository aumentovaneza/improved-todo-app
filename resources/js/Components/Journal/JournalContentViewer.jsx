import { useEditor, EditorContent } from "@tiptap/react";
import { useEffect } from "react";
import { journalExtensions } from "./journalExtensions";

const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] };

export default function JournalContentViewer({ content }) {
    const editor = useEditor({
        editable: false,
        // Same extension set as the editor (via the shared source of truth) so
        // links, images, tables, task lists and footnotes all render here.
        extensions: journalExtensions({ editable: false }),
        content: content || EMPTY_DOC,
        editorProps: {
            attributes: {
                class: "journal-content",
            },
        },
    });

    useEffect(() => {
        if (!editor) return;
        editor.commands.setContent(content || EMPTY_DOC, { emitUpdate: false });
    }, [content, editor]);

    if (!editor) {
        return <p className="text-sm text-light-muted dark:text-dark-muted">Loading…</p>;
    }

    return <EditorContent editor={editor} />;
}

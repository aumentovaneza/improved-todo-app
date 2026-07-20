import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] };

export default function JournalContentViewer({ content }) {
    const editor = useEditor({
        editable: false,
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
            }),
        ],
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

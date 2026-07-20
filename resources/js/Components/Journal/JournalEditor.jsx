import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Quote,
    Undo2,
    Redo2,
} from "lucide-react";

const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] };

function ToolbarButton({ onClick, active = false, disabled = false, label, icon: Icon }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            aria-pressed={active}
            title={label}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-wevie-teal/40 disabled:cursor-not-allowed disabled:opacity-40 ${
                active
                    ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                    : "text-light-secondary hover:bg-light-hover hover:text-light-primary dark:text-dark-secondary dark:hover:bg-dark-hover dark:hover:text-dark-primary"
            }`}
        >
            <Icon className="h-4 w-4" />
        </button>
    );
}

function Divider() {
    return (
        <span
            className="mx-1 h-6 w-px self-center bg-light-border dark:bg-dark-border"
            aria-hidden="true"
        />
    );
}

export default function JournalEditor({ content, onChange }) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
            }),
        ],
        content: content || EMPTY_DOC,
        editorProps: {
            attributes: {
                class: "journal-content min-h-[240px] px-4 py-3",
                "data-placeholder": "Start writing your entry…",
            },
        },
        onUpdate: ({ editor: instance }) => {
            onChange?.(instance.getJSON());
        },
    });

    // Keep the editor in sync if the incoming content changes externally
    // (e.g. resetting the form). Guards against feedback loops.
    useEffect(() => {
        if (!editor) return;
        const incoming = content || EMPTY_DOC;
        const current = editor.getJSON();
        if (JSON.stringify(incoming) !== JSON.stringify(current)) {
            editor.commands.setContent(incoming, { emitUpdate: false });
        }
    }, [content, editor]);

    if (!editor) {
        return (
            <div className="rounded-xl border border-light-border/70 bg-light-card p-4 text-sm text-light-muted dark:border-dark-border/70 dark:bg-dark-card dark:text-dark-muted">
                Loading editor…
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-light-border/70 bg-light-card focus-within:border-wevie-teal focus-within:ring-2 focus-within:ring-wevie-teal/20 dark:border-dark-border/70 dark:bg-dark-card">
            <div
                className="flex flex-wrap items-center gap-1 border-b border-light-border/70 bg-light-hover/40 px-2 py-1.5 dark:border-dark-border/70 dark:bg-dark-hover/40"
                role="toolbar"
                aria-label="Formatting"
            >
                <ToolbarButton
                    label="Bold"
                    icon={Bold}
                    active={editor.isActive("bold")}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                />
                <ToolbarButton
                    label="Italic"
                    icon={Italic}
                    active={editor.isActive("italic")}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                />
                <ToolbarButton
                    label="Underline"
                    icon={UnderlineIcon}
                    active={editor.isActive("underline")}
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                />
                <Divider />
                <ToolbarButton
                    label="Heading 1"
                    icon={Heading1}
                    active={editor.isActive("heading", { level: 1 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                />
                <ToolbarButton
                    label="Heading 2"
                    icon={Heading2}
                    active={editor.isActive("heading", { level: 2 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                />
                <ToolbarButton
                    label="Heading 3"
                    icon={Heading3}
                    active={editor.isActive("heading", { level: 3 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                />
                <Divider />
                <ToolbarButton
                    label="Bullet list"
                    icon={List}
                    active={editor.isActive("bulletList")}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                />
                <ToolbarButton
                    label="Numbered list"
                    icon={ListOrdered}
                    active={editor.isActive("orderedList")}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                />
                <ToolbarButton
                    label="Quote"
                    icon={Quote}
                    active={editor.isActive("blockquote")}
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                />
                <Divider />
                <ToolbarButton
                    label="Undo"
                    icon={Undo2}
                    disabled={!editor.can().undo()}
                    onClick={() => editor.chain().focus().undo().run()}
                />
                <ToolbarButton
                    label="Redo"
                    icon={Redo2}
                    disabled={!editor.can().redo()}
                    onClick={() => editor.chain().focus().redo().run()}
                />
            </div>
            <EditorContent editor={editor} />
        </div>
    );
}

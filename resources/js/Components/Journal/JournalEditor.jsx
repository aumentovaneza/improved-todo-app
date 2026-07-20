import { useEditor, EditorContent } from "@tiptap/react";
import { Menu, Popover } from "@headlessui/react";
import { useEffect, useState } from "react";
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    ListChecks,
    Quote,
    Link2,
    Link2Off,
    Image as ImageIcon,
    Highlighter,
    Minus,
    Table as TableIcon,
    Asterisk,
    Plus,
    Trash2,
    Undo2,
    Redo2,
    Type,
    CaseSensitive,
    Baseline,
    Check,
    ChevronDown,
} from "lucide-react";
import { journalExtensions, isSafeImageUrl, isSafeLinkUrl } from "./journalExtensions";
import Tooltip from "./Tooltip";
import ColorWheelPicker from "./ColorWheelPicker";

const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] };

// Journal-friendly highlight swatches. TipTap stores the chosen color inline as
// `<mark data-color="#…">`, so these hexes are stored VALUES (not Tailwind
// classes) — the one place an explicit hex is correct here.
const HIGHLIGHT_COLORS = [
    { name: "Yellow", color: "#FEF08A" },
    { name: "Green", color: "#BBF7D0" },
    { name: "Blue", color: "#BFDBFE" },
    { name: "Pink", color: "#FBCFE8" },
    { name: "Orange", color: "#FED7AA" },
    { name: "Purple", color: "#E9D5FF" },
];

// Font families offered in the dropdown. `value: null` maps to the editor's
// default (unsetFontFamily) so existing entries stay on the app's Inter font.
const FONT_FAMILIES = [
    { name: "Default", value: null },
    { name: "Sans-serif", value: "ui-sans-serif, system-ui, sans-serif" },
    { name: "Serif", value: "Georgia, Cambria, 'Times New Roman', serif" },
    { name: "Monospace", value: "ui-monospace, SFMono-Regular, Menlo, monospace" },
];

// Font sizes offered in the dropdown. `value: null` clears the size back to the
// paragraph default (unsetFontSize).
const FONT_SIZES = [
    { name: "Small", value: "13px" },
    { name: "Normal", value: null },
    { name: "Large", value: "20px" },
    { name: "XL", value: "26px" },
];

// Text colors stored inline by TipTap as an explicit `style="color: #…"`, so
// hex VALUES are correct here (not Tailwind classes). NOTE: a user-chosen font
// color is fixed and does NOT adapt between light and dark themes — unlike the
// highlight background, we must not override it in CSS because the color is the
// author's deliberate choice. These are mid-tones picked to stay legible on
// BOTH light and dark backgrounds (no pure black / pure white).
const TEXT_COLORS = [
    { name: "Default", color: null },
    { name: "Slate", color: "#64748B" },
    { name: "Red", color: "#EF4444" },
    { name: "Orange", color: "#F97316" },
    { name: "Green", color: "#22C55E" },
    { name: "Blue", color: "#3B82F6" },
    { name: "Purple", color: "#A855F7" },
    { name: "Pink", color: "#EC4899" },
];

const BASE_BUTTON =
    "inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-wevie-teal/40 disabled:cursor-not-allowed disabled:opacity-40";
const ACTIVE_BUTTON =
    "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300";
const IDLE_BUTTON =
    "text-light-secondary hover:bg-light-hover hover:text-light-primary dark:text-dark-secondary dark:hover:bg-dark-hover dark:hover:text-dark-primary";

function buttonClass(active = false) {
    return `${BASE_BUTTON} ${active ? ACTIVE_BUTTON : IDLE_BUTTON}`;
}

function ToolbarButton({ onClick, active = false, disabled = false, label, icon: Icon }) {
    return (
        <Tooltip label={label}>
            <button
                type="button"
                onClick={onClick}
                disabled={disabled}
                aria-label={label}
                aria-pressed={active}
                className={buttonClass(active)}
            >
                <Icon className="h-4 w-4" />
            </button>
        </Tooltip>
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

/* ------------------------------------------------------------------ */
/* Link popover                                                        */
/* ------------------------------------------------------------------ */

function LinkControl({ editor }) {
    const isActive = editor.isActive("link");
    const selectionEmpty = editor.state.selection.empty;
    // Nothing to do when there is neither a selection to wrap nor a link to edit.
    const disabled = selectionEmpty && !isActive;

    return (
        <div className="inline-flex items-center">
            <Popover className="relative">
                {({ close }) => (
                    <>
                        <Tooltip label={isActive ? "Edit link" : "Add link"}>
                            <Popover.Button
                                type="button"
                                disabled={disabled}
                                aria-label={isActive ? "Edit link" : "Add link"}
                                aria-pressed={isActive}
                                className={buttonClass(isActive)}
                            >
                                <Link2 className="h-4 w-4" />
                            </Popover.Button>
                        </Tooltip>
                        <Popover.Panel
                            anchor={{ to: "bottom end", gap: 8 }}
                            transition
                            className="z-20 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-light-border/70 bg-light-card p-3 shadow-soft transition duration-150 ease-out data-[closed]:-translate-y-1 data-[closed]:opacity-0 dark:border-dark-border/70 dark:bg-dark-card"
                        >
                            <LinkForm editor={editor} onDone={close} />
                        </Popover.Panel>
                    </>
                )}
            </Popover>
            {isActive && (
                <ToolbarButton
                    label="Remove link"
                    icon={Link2Off}
                    onClick={() => editor.chain().focus().extendMarkRange("link").unsetLink().run()}
                />
            )}
        </div>
    );
}

function LinkForm({ editor, onDone }) {
    const currentHref = editor.getAttributes("link")?.href ?? "";
    const [value, setValue] = useState(currentHref);
    const [error, setError] = useState("");

    const apply = () => {
        const trimmed = value.trim();
        if (!trimmed) {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            onDone?.();
            return;
        }
        // Assume https when the author omits a scheme, then validate.
        const normalized = /^[a-z][\w+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
        if (!isSafeLinkUrl(normalized)) {
            setError("Enter a valid http(s) or mailto link.");
            return;
        }
        editor.chain().focus().extendMarkRange("link").setLink({ href: normalized }).run();
        onDone?.();
    };

    return (
        <div className="space-y-2">
            <label
                className="block text-xs font-medium text-light-secondary dark:text-dark-secondary"
                htmlFor="journal-link-url"
            >
                Link URL
            </label>
            <input
                id="journal-link-url"
                type="url"
                // Move focus into the popover the user just opened on demand.
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                value={value}
                onChange={(e) => {
                    setValue(e.target.value);
                    if (error) setError("");
                }}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        apply();
                    }
                }}
                placeholder="https://example.com"
                className="w-full rounded-lg border border-light-border bg-light-primary px-3 py-1.5 text-sm text-light-primary placeholder:text-light-muted focus:border-wevie-teal focus:outline-none focus:ring-1 focus:ring-wevie-teal dark:border-dark-border dark:bg-dark-primary dark:text-dark-primary dark:placeholder:text-dark-muted"
            />
            {error && (
                <p className="text-xs text-error-600 dark:text-error-400" role="alert">
                    {error}
                </p>
            )}
            <div className="flex items-center justify-end gap-2 pt-1">
                <button
                    type="button"
                    onClick={onDone}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-light-secondary hover:bg-light-hover dark:text-dark-secondary dark:hover:bg-dark-hover"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={apply}
                    className="rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-wevie-teal/40"
                >
                    Apply
                </button>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Image popover                                                       */
/* ------------------------------------------------------------------ */

function ImageControl({ editor }) {
    return (
        <Popover className="relative">
            {({ close }) => (
                <>
                    <Tooltip label="Insert image by URL">
                        <Popover.Button
                            type="button"
                            aria-label="Insert image by URL"
                            className={buttonClass(false)}
                        >
                            <ImageIcon className="h-4 w-4" />
                        </Popover.Button>
                    </Tooltip>
                    <Popover.Panel
                        anchor={{ to: "bottom end", gap: 8 }}
                        transition
                        className="z-20 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-light-border/70 bg-light-card p-3 shadow-soft transition duration-150 ease-out data-[closed]:-translate-y-1 data-[closed]:opacity-0 dark:border-dark-border/70 dark:bg-dark-card"
                    >
                        <ImageForm editor={editor} onDone={close} />
                    </Popover.Panel>
                </>
            )}
        </Popover>
    );
}

function ImageForm({ editor, onDone }) {
    const [src, setSrc] = useState("");
    const [alt, setAlt] = useState("");
    const [error, setError] = useState("");

    const apply = () => {
        const trimmed = src.trim();
        if (!isSafeImageUrl(trimmed)) {
            setError("Enter a valid http(s) image URL.");
            return;
        }
        editor
            .chain()
            .focus()
            .setImage({ src: trimmed, alt: alt.trim() || undefined })
            .run();
        onDone?.();
    };

    return (
        <div className="space-y-2">
            <label
                className="block text-xs font-medium text-light-secondary dark:text-dark-secondary"
                htmlFor="journal-image-url"
            >
                Image URL
            </label>
            <input
                id="journal-image-url"
                type="url"
                // Move focus into the popover the user just opened on demand.
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                value={src}
                onChange={(e) => {
                    setSrc(e.target.value);
                    if (error) setError("");
                }}
                placeholder="https://example.com/photo.jpg"
                className="w-full rounded-lg border border-light-border bg-light-primary px-3 py-1.5 text-sm text-light-primary placeholder:text-light-muted focus:border-wevie-teal focus:outline-none focus:ring-1 focus:ring-wevie-teal dark:border-dark-border dark:bg-dark-primary dark:text-dark-primary dark:placeholder:text-dark-muted"
            />
            <label
                className="block text-xs font-medium text-light-secondary dark:text-dark-secondary"
                htmlFor="journal-image-alt"
            >
                Alt text{" "}
                <span className="font-normal text-light-muted dark:text-dark-muted">
                    (optional)
                </span>
            </label>
            <input
                id="journal-image-alt"
                type="text"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        apply();
                    }
                }}
                placeholder="Describe the image"
                className="w-full rounded-lg border border-light-border bg-light-primary px-3 py-1.5 text-sm text-light-primary placeholder:text-light-muted focus:border-wevie-teal focus:outline-none focus:ring-1 focus:ring-wevie-teal dark:border-dark-border dark:bg-dark-primary dark:text-dark-primary dark:placeholder:text-dark-muted"
            />
            {error && (
                <p className="text-xs text-error-600 dark:text-error-400" role="alert">
                    {error}
                </p>
            )}
            <div className="flex items-center justify-end gap-2 pt-1">
                <button
                    type="button"
                    onClick={onDone}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-light-secondary hover:bg-light-hover dark:text-dark-secondary dark:hover:bg-dark-hover"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={apply}
                    className="rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-wevie-teal/40"
                >
                    Insert
                </button>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Highlight color picker                                              */
/* ------------------------------------------------------------------ */

function HighlightControl({ editor }) {
    const isActive = editor.isActive("highlight");

    return (
        <Popover className="relative">
            <Tooltip label="Highlight">
                <Popover.Button
                    type="button"
                    aria-label="Highlight"
                    aria-pressed={isActive}
                    className={buttonClass(isActive)}
                >
                    <Highlighter className="h-4 w-4" />
                </Popover.Button>
            </Tooltip>
            <Popover.Panel
                anchor={{ to: "bottom end", gap: 8 }}
                transition
                className="z-20 max-w-[calc(100vw-2rem)] rounded-xl border border-light-border/70 bg-light-card p-3 shadow-soft transition duration-150 ease-out data-[closed]:-translate-y-1 data-[closed]:opacity-0 dark:border-dark-border/70 dark:bg-dark-card"
            >
                <p className="mb-2 text-xs font-medium text-light-secondary dark:text-dark-secondary">
                    Highlight color
                </p>
                {/* Seed the wheel from the current selection's highlight. Use
                    setHighlight (not toggle) so dragging updates live instead of
                    flipping the mark off and on. */}
                <ColorWheelPicker
                    value={editor.getAttributes("highlight").color ?? null}
                    presets={HIGHLIGHT_COLORS}
                    onChange={(hex) => editor.chain().setHighlight({ color: hex }).run()}
                    onRemove={() => editor.chain().unsetHighlight().run()}
                    removeLabel="Remove highlight"
                />
            </Popover.Panel>
        </Popover>
    );
}

/* ------------------------------------------------------------------ */
/* Font family / size dropdowns                                        */
/* ------------------------------------------------------------------ */

const DROPDOWN_TRIGGER =
    "inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-wevie-teal/40 data-[open]:bg-primary-100 data-[open]:text-primary-700 dark:data-[open]:bg-primary-900/30 dark:data-[open]:text-primary-300";
const DROPDOWN_PANEL =
    "z-20 w-44 max-w-[calc(100vw-2rem)] rounded-xl border border-light-border/70 bg-light-card p-1 shadow-soft transition duration-150 ease-out [--anchor-gap:8px] focus:outline-none data-[closed]:-translate-y-1 data-[closed]:opacity-0 dark:border-dark-border/70 dark:bg-dark-card";
const DROPDOWN_ITEM =
    "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm text-light-primary transition-colors data-[focus]:bg-light-hover dark:text-dark-primary dark:data-[focus]:bg-dark-hover";

function FontFamilyControl({ editor }) {
    const activeFamily = editor.getAttributes("textStyle").fontFamily ?? null;
    const current = FONT_FAMILIES.find((f) => f.value === activeFamily) ?? FONT_FAMILIES[0];

    const apply = (value) => {
        if (value) {
            editor.chain().focus().setFontFamily(value).run();
        } else {
            editor.chain().focus().unsetFontFamily().run();
        }
    };

    return (
        <Menu as="div" className="relative">
            <Tooltip label="Font family">
                <Menu.Button
                    type="button"
                    aria-label={`Font family: ${current.name}`}
                    className={`${DROPDOWN_TRIGGER} ${IDLE_BUTTON}`}
                >
                    <CaseSensitive className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden max-w-[6rem] truncate sm:inline">{current.name}</span>
                    <ChevronDown className="h-3 w-3" aria-hidden="true" />
                </Menu.Button>
            </Tooltip>
            <Menu.Items anchor={{ to: "bottom start" }} className={DROPDOWN_PANEL}>
                {FONT_FAMILIES.map((family) => {
                    const selected = family.value === activeFamily;
                    return (
                        <Menu.Item key={family.name}>
                            <button
                                type="button"
                                onClick={() => apply(family.value)}
                                className={DROPDOWN_ITEM}
                                style={{ fontFamily: family.value ?? undefined }}
                            >
                                <span className="truncate">{family.name}</span>
                                {selected && (
                                    <Check
                                        className="h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400"
                                        aria-hidden="true"
                                    />
                                )}
                            </button>
                        </Menu.Item>
                    );
                })}
            </Menu.Items>
        </Menu>
    );
}

function FontSizeControl({ editor }) {
    const activeSize = editor.getAttributes("textStyle").fontSize ?? null;
    const current = FONT_SIZES.find((s) => s.value === activeSize) ?? FONT_SIZES[1];

    const apply = (value) => {
        if (value) {
            editor.chain().focus().setFontSize(value).run();
        } else {
            editor.chain().focus().unsetFontSize().run();
        }
    };

    return (
        <Menu as="div" className="relative">
            <Tooltip label="Font size">
                <Menu.Button
                    type="button"
                    aria-label={`Font size: ${current.name}`}
                    className={`${DROPDOWN_TRIGGER} ${IDLE_BUTTON}`}
                >
                    <Type className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden sm:inline">{current.name}</span>
                    <ChevronDown className="h-3 w-3" aria-hidden="true" />
                </Menu.Button>
            </Tooltip>
            <Menu.Items anchor={{ to: "bottom start" }} className={DROPDOWN_PANEL}>
                {FONT_SIZES.map((size) => {
                    const selected = size.value === activeSize;
                    return (
                        <Menu.Item key={size.name}>
                            <button
                                type="button"
                                onClick={() => apply(size.value)}
                                className={DROPDOWN_ITEM}
                            >
                                {/* Preview each option at its own size (capped so
                                    the menu row stays readable). */}
                                <span
                                    className="truncate"
                                    style={{ fontSize: size.value ?? "16px" }}
                                >
                                    {size.name}
                                </span>
                                {selected && (
                                    <Check
                                        className="h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400"
                                        aria-hidden="true"
                                    />
                                )}
                            </button>
                        </Menu.Item>
                    );
                })}
            </Menu.Items>
        </Menu>
    );
}

/* ------------------------------------------------------------------ */
/* Font color picker (mirrors the highlight color picker)              */
/* ------------------------------------------------------------------ */

function FontColorControl({ editor }) {
    const activeColor = editor.getAttributes("textStyle").color ?? null;
    const hasColor = Boolean(activeColor);

    return (
        <Popover className="relative">
            <Tooltip label="Font color">
                <Popover.Button
                    type="button"
                    aria-label="Font color"
                    aria-pressed={hasColor}
                    className={buttonClass(hasColor)}
                >
                    <Baseline
                        className="h-4 w-4"
                        aria-hidden="true"
                        style={activeColor ? { color: activeColor } : undefined}
                    />
                </Popover.Button>
            </Tooltip>
            <Popover.Panel
                anchor={{ to: "bottom end", gap: 8 }}
                transition
                className="z-20 max-w-[calc(100vw-2rem)] rounded-xl border border-light-border/70 bg-light-card p-3 shadow-soft transition duration-150 ease-out data-[closed]:-translate-y-1 data-[closed]:opacity-0 dark:border-dark-border/70 dark:bg-dark-card"
            >
                <p className="mb-2 text-xs font-medium text-light-secondary dark:text-dark-secondary">
                    Font color
                </p>
                {/* Seed the wheel from the current selection's text color and
                    push updates live via setColor as the wheel moves. */}
                <ColorWheelPicker
                    value={editor.getAttributes("textStyle").color ?? null}
                    presets={TEXT_COLORS.filter((c) => c.color)}
                    onChange={(hex) => editor.chain().setColor(hex).run()}
                    onRemove={() => editor.chain().unsetColor().run()}
                    removeLabel="Default color"
                />
            </Popover.Panel>
        </Popover>
    );
}

/* ------------------------------------------------------------------ */
/* Table contextual controls                                           */
/* ------------------------------------------------------------------ */

function TableActionButton({ onClick, label, icon: Icon }) {
    return (
        <Tooltip label={label}>
            <button
                type="button"
                onClick={onClick}
                aria-label={label}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-light-secondary transition-colors duration-150 hover:bg-light-hover hover:text-light-primary focus:outline-none focus:ring-2 focus:ring-wevie-teal/40 dark:text-dark-secondary dark:hover:bg-dark-hover dark:hover:text-dark-primary"
            >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{label}</span>
            </button>
        </Tooltip>
    );
}

function TableControls({ editor }) {
    return (
        <div
            className="flex flex-wrap items-center gap-1 border-b border-light-border/70 bg-light-hover/20 px-2 py-1.5 dark:border-dark-border/70 dark:bg-dark-hover/20"
            role="toolbar"
            aria-label="Table"
        >
            <TableActionButton
                label="Column left"
                icon={Plus}
                onClick={() => editor.chain().focus().addColumnBefore().run()}
            />
            <TableActionButton
                label="Column right"
                icon={Plus}
                onClick={() => editor.chain().focus().addColumnAfter().run()}
            />
            <TableActionButton
                label="Row above"
                icon={Plus}
                onClick={() => editor.chain().focus().addRowBefore().run()}
            />
            <TableActionButton
                label="Row below"
                icon={Plus}
                onClick={() => editor.chain().focus().addRowAfter().run()}
            />
            <Divider />
            <TableActionButton
                label="Delete column"
                icon={Minus}
                onClick={() => editor.chain().focus().deleteColumn().run()}
            />
            <TableActionButton
                label="Delete row"
                icon={Minus}
                onClick={() => editor.chain().focus().deleteRow().run()}
            />
            <TableActionButton
                label="Delete table"
                icon={Trash2}
                onClick={() => editor.chain().focus().deleteTable().run()}
            />
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Editor                                                              */
/* ------------------------------------------------------------------ */

export default function JournalEditor({ content, onChange }) {
    const editor = useEditor({
        extensions: journalExtensions({ editable: true }),
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

    const inTable = editor.isActive("table");

    return (
        <div className="overflow-hidden rounded-xl border border-light-border/70 bg-light-card focus-within:border-wevie-teal focus-within:ring-2 focus-within:ring-wevie-teal/20 dark:border-dark-border/70 dark:bg-dark-card">
            <div
                className="flex flex-wrap items-center gap-1 border-b border-light-border/70 bg-light-hover/40 px-2 py-1.5 dark:border-dark-border/70 dark:bg-dark-hover/40"
                role="toolbar"
                aria-label="Formatting"
            >
                {/* Text format */}
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
                <HighlightControl editor={editor} />
                <Divider />
                {/* Font: family, size, color */}
                <FontFamilyControl editor={editor} />
                <FontSizeControl editor={editor} />
                <FontColorControl editor={editor} />
                <Divider />
                {/* Headings */}
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
                {/* Lists */}
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
                    label="Task list"
                    icon={ListChecks}
                    active={editor.isActive("taskList")}
                    onClick={() => editor.chain().focus().toggleTaskList().run()}
                />
                <ToolbarButton
                    label="Quote"
                    icon={Quote}
                    active={editor.isActive("blockquote")}
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                />
                <Divider />
                {/* Insert */}
                <LinkControl editor={editor} />
                <ImageControl editor={editor} />
                <ToolbarButton
                    label="Horizontal rule"
                    icon={Minus}
                    onClick={() => editor.chain().focus().setHorizontalRule().run()}
                />
                <ToolbarButton
                    label="Insert table"
                    icon={TableIcon}
                    active={inTable}
                    onClick={() =>
                        editor
                            .chain()
                            .focus()
                            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                            .run()
                    }
                />
                <ToolbarButton
                    label="Insert footnote"
                    icon={Asterisk}
                    onClick={() => editor.chain().focus().addFootnote().run()}
                />
                <Divider />
                {/* History */}
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
            {inTable && <TableControls editor={editor} />}
            <EditorContent editor={editor} />
        </div>
    );
}

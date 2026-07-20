import StarterKit from "@tiptap/starter-kit";
import Document from "@tiptap/extension-document";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Highlight from "@tiptap/extension-highlight";
// TipTap v3 consolidates the TextStyle-based marks into a single package: the
// base `TextStyle` mark plus `Color`, `FontFamily` and `FontSize` ship as named
// exports from `@tiptap/extension-text-style` (no separate packages needed).
import { TextStyle, Color, FontFamily, FontSize } from "@tiptap/extension-text-style";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import { Footnotes, Footnote, FootnoteReference } from "tiptap-footnotes";

// Only http(s) and mailto links are ever allowed. Everything else
// (javascript:, data:, file:, …) is rejected before it can be stored.
export const ALLOWED_LINK_PROTOCOLS = ["http", "https", "mailto"];

/**
 * Returns true only for safe, absolute http(s) URLs — used to validate the
 * image dialog before inserting a node.
 */
export function isSafeImageUrl(url) {
    if (typeof url !== "string") return false;
    const trimmed = url.trim();
    if (!trimmed) return false;
    try {
        const parsed = new URL(trimmed);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
        return false;
    }
}

/**
 * Returns true only for links using an allowed protocol (http, https, mailto).
 * Rejects javascript:, data: and other unsafe schemes before `setLink`.
 */
export function isSafeLinkUrl(url) {
    if (typeof url !== "string") return false;
    const trimmed = url.trim();
    if (!trimmed) return false;
    try {
        const parsed = new URL(trimmed);
        const scheme = parsed.protocol.replace(/:$/, "").toLowerCase();
        return ALLOWED_LINK_PROTOCOLS.includes(scheme);
    } catch {
        return false;
    }
}

/**
 * The single source of truth for the Journal editor and the read-only viewer.
 * Both MUST register the same node/mark set or saved entries containing the
 * newer nodes (links, images, tables, task lists, footnotes, …) would fail to
 * render in the Show view.
 *
 * The only permitted difference is Link's `openOnClick`: links stay inert while
 * editing (so clicks place the caret) and open in the read-only viewer.
 */
export function journalExtensions({ editable = true } = {}) {
    return [
        // StarterKit already bundles Link, Underline, HorizontalRule and the
        // Document node. We disable its Link (configured separately below for
        // security) and its Document (extended below to host footnotes).
        StarterKit.configure({
            heading: { levels: [1, 2, 3] },
            link: false,
            document: false,
        }),
        // Allow an optional trailing footnotes block. A bare paragraph is a
        // `block`, so existing plain-paragraph entries still parse unchanged.
        Document.extend({
            content: "block+ footnotes?",
        }),
        Link.configure({
            openOnClick: !editable,
            autolink: true,
            linkOnPaste: true,
            defaultProtocol: "https",
            protocols: ALLOWED_LINK_PROTOCOLS,
            HTMLAttributes: {
                rel: "noopener noreferrer nofollow",
                target: "_blank",
            },
            isAllowedUri: (url, ctx) => ctx.defaultValidate(url) && isSafeLinkUrl(url),
            shouldAutoLink: (url) => isSafeLinkUrl(url),
        }),
        Image.configure({
            inline: false,
            allowBase64: false,
            HTMLAttributes: {
                loading: "lazy",
            },
        }),
        // Multicolor lets entries store per-mark colors inline as
        // `<mark data-color="#…">`; the shared viewer renders them automatically.
        Highlight.configure({ multicolor: true }),
        // Inline text styling. `TextStyle` is the base mark that carries the
        // inline `style` attribute; Color/FontFamily/FontSize each add one
        // global attribute on top of it (font color, font face, font size).
        // StarterKit does NOT bundle TextStyle, so there is no duplicate.
        // Registering all four in this SHARED module is what lets the read-only
        // viewer render color/family/size for saved entries. Note: a font COLOR
        // the user picks is stored as an explicit inline hex and does NOT adapt
        // between light/dark themes (that is intentional — it is the user's
        // choice; see the palette note in JournalEditor.jsx).
        TextStyle,
        Color,
        FontFamily,
        FontSize,
        TaskList,
        TaskItem.configure({ nested: true }),
        Table.configure({ resizable: editable }),
        TableRow,
        TableHeader,
        TableCell,
        Footnotes,
        Footnote,
        FootnoteReference,
    ];
}

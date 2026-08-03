import { Menu } from "@headlessui/react";
import { MoreVertical } from "lucide-react";
import { useRef } from "react";

// Overflow menu for a single task row's actions. Modeled on TaskStatusSelect:
// a Headless UI `Menu` whose panel is portaled via `anchor` so it is never
// clipped by the `overflow-hidden` Tasks card, with `stopPropagation` guards so
// clicks never trigger the surrounding row drag/open handlers.
//
// Interaction: on hover-capable pointers (desktop) the menu opens on hover and
// closes on hover-out, with a short close timer so crossing the gap between the
// button and the portaled panel doesn't close it. On touch (no hover) the
// hover handlers no-op and Headless UI's native tap-to-open / tap-outside-to-
// close takes over.
//
// `items` is an array of { label, icon, onClick, danger? }.
const canHover = () =>
    typeof window !== "undefined" &&
    window.matchMedia?.("(hover: hover) and (pointer: fine)").matches;

export default function TaskActionsMenu({ items = [] }) {
    const buttonRef = useRef(null);
    const closeTimer = useRef(null);

    const cancelClose = () => clearTimeout(closeTimer.current);

    return (
        <Menu as="div" className="relative" onClick={(e) => e.stopPropagation()}>
            {({ open, close }) => {
                const handleEnter = () => {
                    if (!canHover()) return;
                    cancelClose();
                    if (!open) buttonRef.current?.click();
                };
                const scheduleClose = () => {
                    if (!canHover()) return;
                    cancelClose();
                    closeTimer.current = setTimeout(() => close(), 120);
                };

                return (
                    <>
                        <Menu.Button
                            ref={buttonRef}
                            type="button"
                            title="Task options"
                            onClick={(e) => e.stopPropagation()}
                            onMouseEnter={handleEnter}
                            onMouseLeave={scheduleClose}
                            className="rounded-md p-1 text-light-muted transition-colors hover:bg-light-hover hover:text-wevie-teal focus:outline-none focus:ring-2 focus:ring-wevie-teal/40 dark:text-dark-muted dark:hover:bg-dark-hover dark:hover:text-wevie-mint"
                        >
                            <MoreVertical className="h-4 w-4" aria-hidden="true" />
                        </Menu.Button>

                        <Menu.Items
                            anchor={{ to: "bottom end", gap: 4 }}
                            onMouseEnter={cancelClose}
                            onMouseLeave={scheduleClose}
                            className="z-50 w-44 rounded-lg border border-light-border/70 bg-light-card py-1 shadow-soft focus:outline-none dark:border-dark-border/70 dark:bg-dark-card"
                        >
                            {items.map((item) => (
                                <Menu.Item key={item.label}>
                                    {({ active }) => (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                item.onClick?.();
                                            }}
                                            className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs ${
                                                item.danger
                                                    ? "text-rose-600 dark:text-rose-300"
                                                    : "text-light-primary dark:text-dark-primary"
                                            } ${
                                                active
                                                    ? "bg-light-hover dark:bg-dark-hover"
                                                    : ""
                                            }`}
                                        >
                                            <item.icon
                                                className="h-4 w-4"
                                                aria-hidden="true"
                                            />
                                            <span className="flex-1">
                                                {item.label}
                                            </span>
                                        </button>
                                    )}
                                </Menu.Item>
                            ))}
                        </Menu.Items>
                    </>
                );
            }}
        </Menu>
    );
}

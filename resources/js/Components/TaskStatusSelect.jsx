import { Menu } from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";

// Single source of truth for task status display metadata. Reused by the inline
// dropdown below and by the "Group by status" buckets on the Tasks page.
//   - `dotClass` is a Tailwind utility for JSX dots (no raw hex in components).
//   - `color` is a CSS value for data-driven inline-style dots, matching the
//     other Tasks group branches (category / priority / due date).
export const TASK_STATUS_OPTIONS = [
    { value: "pending", label: "Ready", dotClass: "bg-amber-500", color: "#F59E0B" },
    { value: "in_progress", label: "In Progress", dotClass: "bg-sky-500", color: "#0EA5E9" },
    { value: "completed", label: "Completed", dotClass: "bg-emerald-500", color: "#10B981" },
    { value: "cancelled", label: "Paused", dotClass: "bg-slate-400", color: "#94A3B8" },
];

// Inline, accessible status picker for a task row. Selecting an option calls
// `onChange(task, newStatus)`; clicks are contained so they never trigger the
// surrounding row drag/open handlers.
export default function TaskStatusSelect({ task, onChange, disabled = false }) {
    const current =
        TASK_STATUS_OPTIONS.find((option) => option.value === task.status) ??
        TASK_STATUS_OPTIONS[0];

    return (
        <Menu
            as="div"
            className="relative"
            onClick={(e) => e.stopPropagation()}
        >
            <Menu.Button
                type="button"
                disabled={disabled}
                onClick={(e) => e.stopPropagation()}
                title="Change status"
                className="inline-flex items-center gap-1.5 rounded-full border border-light-border/70 bg-light-card px-2 py-1 text-xs font-medium text-light-secondary transition-colors hover:border-wevie-teal hover:text-wevie-teal focus:outline-none focus:ring-2 focus:ring-wevie-teal/40 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-border/70 dark:bg-dark-card dark:text-dark-secondary dark:hover:border-wevie-mint dark:hover:text-wevie-mint"
            >
                <span
                    className={`h-2 w-2 rounded-full ${current.dotClass}`}
                    aria-hidden="true"
                />
                {current.label}
                <ChevronDown className="h-3 w-3" aria-hidden="true" />
            </Menu.Button>

            <Menu.Items
                anchor={{ to: "bottom end", gap: 4 }}
                className="z-50 w-40 rounded-lg border border-light-border/70 bg-light-card py-1 shadow-soft focus:outline-none dark:border-dark-border/70 dark:bg-dark-card"
            >
                {TASK_STATUS_OPTIONS.map((option) => (
                    <Menu.Item key={option.value}>
                        {({ active }) => (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (option.value !== task.status) {
                                        onChange?.(task, option.value);
                                    }
                                }}
                                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-light-primary dark:text-dark-primary ${
                                    active
                                        ? "bg-light-hover dark:bg-dark-hover"
                                        : ""
                                }`}
                            >
                                <span
                                    className={`h-2 w-2 rounded-full ${option.dotClass}`}
                                    aria-hidden="true"
                                />
                                <span className="flex-1">{option.label}</span>
                                {option.value === task.status && (
                                    <Check
                                        className="h-3.5 w-3.5 text-wevie-teal dark:text-wevie-mint"
                                        aria-hidden="true"
                                    />
                                )}
                            </button>
                        )}
                    </Menu.Item>
                ))}
            </Menu.Items>
        </Menu>
    );
}

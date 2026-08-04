import { CalendarDays, CheckCircle, Wallet } from "lucide-react";

/**
 * Shared per-source presentation for calendar items so the FullCalendar
 * `eventContent` renderer and the DayDetailModal describe events, tasks, and
 * finance the same way. `Icon` is a Lucide component reference (render it as
 * `<meta.Icon .../>`); `badgeClass`/`dotClass` use Wevie design tokens with
 * mandatory dark: variants — no raw hex here.
 */
export const SOURCE_META = {
    event: {
        label: "Event",
        Icon: CalendarDays,
        badgeClass:
            "bg-secondary-400/15 text-secondary-600 dark:bg-secondary-400/20 dark:text-secondary-300",
        dotClass: "bg-secondary-400",
    },
    task: {
        label: "Task",
        Icon: CheckCircle,
        badgeClass:
            "bg-primary-400/15 text-primary-600 dark:bg-primary-400/20 dark:text-primary-300",
        dotClass: "bg-primary-400",
    },
    finance: {
        label: "Finance",
        Icon: Wallet,
        badgeClass:
            "bg-warning-500/15 text-warning-600 dark:bg-warning-500/20 dark:text-warning-400",
        dotClass: "bg-warning-500",
    },
};

export const metaForSource = (sourceType) => SOURCE_META[sourceType] ?? SOURCE_META.event;

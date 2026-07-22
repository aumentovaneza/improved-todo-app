import { AlertTriangle, CheckCircle } from "lucide-react";
import WidgetFrame from "@/Components/Dashboard/WidgetFrame";
import TaskList from "@/Components/widgets/partials/TaskList";

export default function OverdueTasksWidget({ data, dragHandleProps }) {
    return (
        <WidgetFrame
            title="Tasks to revisit"
            icon={AlertTriangle}
            iconClassName="bg-amber-100/60 text-amber-500 dark:bg-amber-900/30"
            dragHandleProps={dragHandleProps}
        >
            <TaskList
                tasks={data ?? []}
                emptyIcon={CheckCircle}
                emptyTitle="Nothing waiting here"
                emptyDescription="You’re all caught up — no overdue tasks."
                dueLabel="Was due"
                accentDue
            />
        </WidgetFrame>
    );
}

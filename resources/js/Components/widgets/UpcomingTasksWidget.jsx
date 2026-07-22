import { CalendarClock } from "lucide-react";
import WidgetFrame from "@/Components/Dashboard/WidgetFrame";
import TaskList from "@/Components/widgets/partials/TaskList";

export default function UpcomingTasksWidget({ data, dragHandleProps }) {
    return (
        <WidgetFrame title="Coming up" icon={CalendarClock} dragHandleProps={dragHandleProps}>
            <TaskList
                tasks={data ?? []}
                emptyIcon={CalendarClock}
                emptyTitle="Nothing scheduled yet"
                emptyDescription="Add plans when it feels right and they’ll appear here."
                dueLabel="Due"
            />
        </WidgetFrame>
    );
}

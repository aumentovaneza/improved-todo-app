import { CalendarDays } from "lucide-react";
import WidgetFrame from "@/Components/Dashboard/WidgetFrame";
import TaskList from "@/Components/widgets/partials/TaskList";

export default function TodayTasksWidget({ data, dragHandleProps }) {
    return (
        <WidgetFrame title="Today’s tasks" icon={CalendarDays} dragHandleProps={dragHandleProps}>
            <TaskList
                tasks={data ?? []}
                emptyIcon={CalendarDays}
                emptyTitle="A clear day ahead"
                emptyDescription="Nothing due today — enjoy the breathing room."
                dueLabel="Due"
            />
        </WidgetFrame>
    );
}

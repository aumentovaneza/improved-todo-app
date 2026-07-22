import { Loader, Sparkles } from "lucide-react";
import WidgetFrame from "@/Components/Dashboard/WidgetFrame";
import TaskList from "@/Components/widgets/partials/TaskList";

export default function InProgressWidget({ data, dragHandleProps }) {
    return (
        <WidgetFrame
            title="In progress"
            icon={Loader}
            iconClassName="bg-indigo-100/60 text-indigo-500 dark:bg-indigo-900/30"
            dragHandleProps={dragHandleProps}
        >
            <TaskList
                tasks={data ?? []}
                emptyIcon={Sparkles}
                emptyTitle="Nothing in motion"
                emptyDescription="Start a task and it’ll show up here while you work."
                dueLabel="Due"
            />
        </WidgetFrame>
    );
}

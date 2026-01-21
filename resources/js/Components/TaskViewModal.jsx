import Modal from "./Modal";
import SecondaryButton from "./SecondaryButton";
import SubtaskManager from "./SubtaskManager";
import { Calendar, CheckCircle, Clock } from "lucide-react";

export default function TaskViewModal({ show, onClose, task, onTaskUpdate }) {
    if (!task) return null;

    const getPriorityColor = (priority) => {
        switch (priority) {
            case "urgent":
                return "text-amber-700 bg-amber-100/70 dark:text-amber-200 dark:bg-amber-900/20";
            case "high":
                return "text-orange-700 bg-orange-100/70 dark:text-orange-200 dark:bg-orange-900/20";
            case "medium":
                return "text-sky-700 bg-sky-100/70 dark:text-sky-200 dark:bg-sky-900/20";
            case "low":
                return "text-emerald-700 bg-emerald-100/70 dark:text-emerald-200 dark:bg-emerald-900/20";
            default:
                return "text-slate-600 bg-slate-100/70 dark:text-slate-300 dark:bg-slate-800/40";
        }
    };

    const isOverdue = (dueDate, status) => {
        if (!dueDate || status === "completed") return false;
        return (
            new Date(dueDate) < new Date() &&
            new Date(dueDate).toDateString() !== new Date().toDateString()
        );
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="2xl">
            <div className="max-h-[70vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-light-primary dark:text-dark-primary">
                            {task.title}
                        </h2>
                        {task.is_recurring && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-violet-100/70 text-violet-700 dark:bg-violet-900/20 dark:text-violet-200">
                                Steady rhythm
                            </span>
                        )}
                    </div>

                    {task.description && (
                        <p className="text-light-secondary dark:text-dark-secondary mb-4">
                            {task.description}
                        </p>
                    )}

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        {/* Category */}
                        <div>
                            <h3 className="text-sm font-medium text-light-muted dark:text-dark-muted mb-1">
                                Category
                            </h3>
                            {task.category ? (
                                <div className="flex items-center space-x-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{
                                            backgroundColor:
                                                task.category.color,
                                        }}
                                    />
                                    <span className="text-light-primary dark:text-dark-primary">
                                        {task.category.name}
                                    </span>
                                </div>
                            ) : (
                                <span className="text-light-muted dark:text-dark-muted">
                                    No category yet
                                </span>
                            )}
                        </div>

                        {/* Priority */}
                        <div>
                            <h3 className="text-sm font-medium text-light-muted dark:text-dark-muted mb-1">
                                Priority
                            </h3>
                            <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                                    task.priority
                                )}`}
                            >
                                {task.priority === "urgent"
                                    ? "Focus"
                                    : task.priority.charAt(0).toUpperCase() +
                                      task.priority.slice(1)}
                            </span>
                        </div>

                        {/* Due Date and Time */}
                        <div>
                            <h3 className="text-sm font-medium text-light-muted dark:text-dark-muted mb-1">
                                Planned time
                            </h3>
                            {task.due_date ? (
                                <div
                                    className={`flex flex-col space-y-1 ${
                                        isOverdue(task.due_date, task.status)
                                            ? "text-amber-700 dark:text-amber-200"
                                            : "text-light-primary dark:text-dark-primary"
                                    }`}
                                >
                                    <div className="flex items-center space-x-1">
                                        <Calendar className="h-4 w-4" />
                                        <span>
                                            {isOverdue(
                                                task.due_date,
                                                task.status
                                            )
                                                ? "Planned for "
                                                : ""}
                                            {new Date(
                                                task.due_date
                                            ).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-1 ml-5">
                                        <Clock className="h-3 w-3" />
                                        <span className="text-sm">
                                            {task.is_all_day ||
                                            (!task.start_time && !task.end_time)
                                                ? "All day"
                                                : (() => {
                                                      const formatTime = (
                                                          timeStr
                                                      ) => {
                                                          if (!timeStr)
                                                              return "";
                                                          // Handle both time formats (HH:MM and full datetime)
                                                          if (
                                                              timeStr.includes(
                                                                  "T"
                                                              ) ||
                                                              timeStr.includes(
                                                                  " "
                                                              )
                                                          ) {
                                                              const date =
                                                                  new Date(
                                                                      timeStr
                                                                  );
                                                              return date.toLocaleTimeString(
                                                                  [],
                                                                  {
                                                                      hour: "numeric",
                                                                      minute: "2-digit",
                                                                      hour12: true,
                                                                  }
                                                              );
                                                          }
                                                          // Just time string like "14:30:00" or "14:30"
                                                          const [
                                                              hours,
                                                              minutes,
                                                          ] =
                                                              timeStr.split(
                                                                  ":"
                                                              );
                                                          const hour =
                                                              parseInt(hours);
                                                          const ampm =
                                                              hour >= 12
                                                                  ? "PM"
                                                                  : "AM";
                                                          const displayHour =
                                                              hour % 12 || 12;
                                                          return `${displayHour}:${minutes} ${ampm}`;
                                                      };

                                                      const startTime =
                                                          task.start_time
                                                              ? formatTime(
                                                                    task.start_time
                                                                )
                                                              : "";
                                                      const endTime =
                                                          task.end_time
                                                              ? formatTime(
                                                                    task.end_time
                                                                )
                                                              : "";

                                                      if (
                                                          startTime &&
                                                          endTime
                                                      ) {
                                                          return `${startTime} - ${endTime}`;
                                                      } else if (startTime) {
                                                          return `From ${startTime}`;
                                                      } else if (endTime) {
                                                          return `Until ${endTime}`;
                                                      }
                                                      return "All day";
                                                  })()}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <span className="text-light-muted dark:text-dark-muted">
                                    No date yet
                                </span>
                            )}
                        </div>

                        {/* Status */}
                        <div>
                            <h3 className="text-sm font-medium text-light-muted dark:text-dark-muted mb-1">
                                Status
                            </h3>
                            <div className="flex items-center space-x-1">
                                {task.status === "completed" ? (
                                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                                ) : (
                                    <Clock className="h-4 w-4 text-sky-500" />
                                )}
                                <span className="text-light-primary dark:text-dark-primary">
                                    {task.status === "pending"
                                        ? "Ready"
                                        : task.status === "in_progress"
                                          ? "In flow"
                                          : task.status === "cancelled"
                                            ? "Paused"
                                            : "Completed"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Tags */}
                    {task.tags && task.tags.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-light-muted dark:text-dark-muted mb-2">
                                Tags
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {task.tags.map((tag) => (
                                    <span
                                        key={tag.id}
                                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                                        style={{ backgroundColor: tag.color }}
                                    >
                                        {tag.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Subtasks */}
                    <SubtaskManager
                        key={`view-${task.id}-${task.updated_at}`}
                        task={task}
                        subtasks={task.subtasks || []}
                        canEdit={true}
                        onTaskUpdate={onTaskUpdate}
                    />

                    {/* Reminders */}
                    {task.reminders && task.reminders.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-light-muted dark:text-dark-muted mb-2">
                                Reminders
                            </h3>
                            <div className="space-y-2">
                                {task.reminders.map((reminder) => (
                                    <div
                                        key={reminder.id}
                                        className="flex items-center justify-between"
                                    >
                                        <span className="text-light-primary dark:text-dark-primary">
                                            {new Date(
                                                reminder.reminder_time
                                            ).toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end mt-3">
                        <SecondaryButton onClick={onClose}>
                            Done
                        </SecondaryButton>
                    </div>
                </div>
            </div>
        </Modal>
    );
}

import Modal from "./Modal";
import SecondaryButton from "./SecondaryButton";
import SubtaskManager from "./SubtaskManager";
import { Calendar, CheckCircle, Clock } from "lucide-react";

export default function TaskViewModal({ show, onClose, task, onTaskUpdate }) {
    if (!task) return null;

    const getPriorityColor = (priority) => {
        switch (priority) {
            case "urgent":
                return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20";
            case "high":
                return "text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/20";
            case "medium":
                return "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20";
            case "low":
                return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20";
            default:
                return "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20";
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
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                            {task.title}
                        </h2>
                        {task.is_recurring && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                                Recurring
                            </span>
                        )}
                    </div>

                    {task.description && (
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                            {task.description}
                        </p>
                    )}

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        {/* Category */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
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
                                    <span className="text-gray-900 dark:text-gray-100">
                                        {task.category.name}
                                    </span>
                                </div>
                            ) : (
                                <span className="text-gray-500 dark:text-gray-400">
                                    No category
                                </span>
                            )}
                        </div>

                        {/* Priority */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Priority
                            </h3>
                            <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                                    task.priority
                                )}`}
                            >
                                {task.priority.charAt(0).toUpperCase() +
                                    task.priority.slice(1)}
                            </span>
                        </div>

                        {/* Due Date and Time */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Due Date & Time
                            </h3>
                            {task.due_date ? (
                                <div
                                    className={`flex flex-col space-y-1 ${
                                        isOverdue(task.due_date, task.status)
                                            ? "text-red-600 dark:text-red-400"
                                            : "text-gray-900 dark:text-gray-100"
                                    }`}
                                >
                                    <div className="flex items-center space-x-1">
                                        <Calendar className="h-4 w-4" />
                                        <span>
                                            {isOverdue(
                                                task.due_date,
                                                task.status
                                            )
                                                ? "Overdue - "
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
                                <span className="text-gray-500 dark:text-gray-400">
                                    No due date
                                </span>
                            )}
                        </div>

                        {/* Status */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Status
                            </h3>
                            <div className="flex items-center space-x-1">
                                {task.status === "completed" ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                    <Clock className="h-4 w-4 text-blue-500" />
                                )}
                                <span className="text-gray-900 dark:text-gray-100">
                                    {task.status
                                        .split("_")
                                        .map(
                                            (word) =>
                                                word.charAt(0).toUpperCase() +
                                                word.slice(1)
                                        )
                                        .join(" ")}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Tags */}
                    {task.tags && task.tags.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
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
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                Reminders
                            </h3>
                            <div className="space-y-2">
                                {task.reminders.map((reminder) => (
                                    <div
                                        key={reminder.id}
                                        className="flex items-center justify-between"
                                    >
                                        <span className="text-gray-900 dark:text-gray-100">
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
                            Close
                        </SecondaryButton>
                    </div>
                </div>
            </div>
        </Modal>
    );
}

import { Timer, Play, Pause, RotateCcw } from "lucide-react";
import WidgetFrame from "@/Components/Dashboard/WidgetFrame";
import { usePomodoro } from "@/Components/Pomodoro/PomodoroContext";

const SESSION_LABELS = {
    work: "Focus session",
    short_break: "Short break",
    long_break: "Long break",
};

/**
 * Client-only Pomodoro widget. It reads the shared PomodoroContext rather than
 * any server payload, so the `data` prop is intentionally ignored.
 */
export default function PomodoroWidget({ dragHandleProps }) {
    const {
        timeLeft,
        currentSession,
        sessionsCompleted,
        isRunning,
        isIdle,
        formatTime,
        getProgress,
        startTimer,
        pauseTimer,
        resetTimer,
    } = usePomodoro();

    const progress = Math.min(100, Math.max(0, getProgress()));

    return (
        <WidgetFrame
            title="Pomodoro"
            icon={Timer}
            iconClassName="bg-rose-100/60 text-rose-500 dark:bg-rose-900/30"
            dragHandleProps={dragHandleProps}
        >
            <div className="flex flex-col items-center gap-4 text-center">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-adaptive-muted">
                        {SESSION_LABELS[currentSession] ?? "Focus session"}
                    </p>
                    <p
                        className="mt-1 text-4xl font-bold tabular-nums text-adaptive-primary"
                        aria-live="polite"
                    >
                        {formatTime(timeLeft)}
                    </p>
                </div>

                <div
                    className="h-2 w-full overflow-hidden rounded-full bg-light-hover dark:bg-dark-hover"
                    role="progressbar"
                    aria-valuenow={Math.round(progress)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Session progress"
                >
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-wevie-teal to-wevie-mint transition-[width] duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="flex items-center gap-2">
                    {isRunning ? (
                        <button
                            type="button"
                            onClick={pauseTimer}
                            className="btn-secondary px-3 py-1.5 text-sm"
                        >
                            <Pause className="mr-1.5 h-4 w-4" />
                            Pause
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={startTimer}
                            className="btn-primary px-3 py-1.5 text-sm"
                        >
                            <Play className="mr-1.5 h-4 w-4" />
                            {isIdle ? "Start" : "Resume"}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={resetTimer}
                        aria-label="Reset timer"
                        className="btn-secondary px-3 py-1.5 text-sm"
                    >
                        <RotateCcw className="h-4 w-4" />
                    </button>
                </div>

                <p className="text-xs text-adaptive-muted">
                    {sessionsCompleted} session
                    {sessionsCompleted === 1 ? "" : "s"} completed today
                </p>
            </div>
        </WidgetFrame>
    );
}

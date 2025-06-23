import React from "react";
import { usePomodoro } from "./PomodoroContext";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import DangerButton from "@/Components/DangerButton";

export default function FloatingPomodoroWidget() {
    const {
        isExpanded,
        toggleExpanded,
        setExpanded,
        timeLeft,
        formatTime,
        isRunning,
        isPaused,
        isIdle,
        startTimer,
        pauseTimer,
        resetTimer,
        setFocusMode,
        currentSession,
        sessionsCompleted,
        getProgress,
    } = usePomodoro();

    const handleStartFocus = () => {
        startTimer();
        setFocusMode(true);
        setExpanded(false);
    };

    const getSessionLabel = () => {
        switch (currentSession) {
            case "work":
                return "Focus";
            case "short_break":
                return "Short Break";
            case "long_break":
                return "Long Break";
            default:
                return "Focus";
        }
    };

    const getSessionColor = () => {
        switch (currentSession) {
            case "work":
                return "bg-red-500 hover:bg-red-600";
            case "short_break":
                return "bg-green-500 hover:bg-green-600";
            case "long_break":
                return "bg-blue-500 hover:bg-blue-600";
            default:
                return "bg-red-500 hover:bg-red-600";
        }
    };

    return (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
            <style jsx>{`
                @keyframes breathe {
                    0%,
                    100% {
                        transform: scale(1);
                    }
                    50% {
                        transform: scale(1.05);
                    }
                }
                @keyframes wiggle {
                    0% {
                        transform: rotate(-3deg);
                    }
                    100% {
                        transform: rotate(3deg);
                    }
                }
                @keyframes slideInUp {
                    from {
                        transform: translateY(20px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                @keyframes heartbeat {
                    0% {
                        transform: scale(1);
                    }
                    25% {
                        transform: scale(1.1);
                    }
                    50% {
                        transform: scale(1);
                    }
                    75% {
                        transform: scale(1.05);
                    }
                    100% {
                        transform: scale(1);
                    }
                }
            `}</style>
            {isExpanded ? (
                <div
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 w-72 sm:w-80 max-w-[calc(100vw-2rem)] transform transition-all duration-300"
                    style={{
                        animation: "slideInUp 0.3s ease-out",
                        transformOrigin: "bottom right",
                    }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                            Pomodoro Timer
                        </h3>
                        <button
                            onClick={() => setExpanded(false)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <svg
                                className="w-4 h-4 sm:w-5 sm:h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    {/* Session Info */}
                    <div className="text-center mb-3 sm:mb-4">
                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">
                            {getSessionLabel()} Session
                        </div>
                        <div
                            className="text-2xl sm:text-3xl font-mono font-bold text-gray-900 dark:text-white transition-all duration-300"
                            style={{
                                animation: isRunning
                                    ? "heartbeat 2s ease-in-out infinite"
                                    : "none",
                            }}
                        >
                            {formatTime(timeLeft)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Sessions completed: {sessionsCompleted}
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3 sm:mb-4">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 sm:h-2">
                            <div
                                className={`h-1.5 sm:h-2 rounded-full transition-all duration-1000 ${
                                    currentSession === "work"
                                        ? "bg-red-500"
                                        : currentSession === "short_break"
                                        ? "bg-green-500"
                                        : "bg-blue-500"
                                }`}
                                style={{ width: `${getProgress()}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="space-y-2">
                        {isIdle && (
                            <>
                                <div className="flex gap-2">
                                    <PrimaryButton
                                        onClick={startTimer}
                                        className="flex-1 text-sm sm:text-base py-2 sm:py-2.5 justify-center hover:scale-105 transition-transform duration-200"
                                    >
                                        <span className="inline-flex items-center">
                                            ▶️ Start
                                        </span>
                                    </PrimaryButton>
                                    <PrimaryButton
                                        onClick={handleStartFocus}
                                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-sm sm:text-base py-2 sm:py-2.5 justify-center hover:scale-105 transition-transform duration-200"
                                    >
                                        <span className="hidden sm:inline inline-flex items-center">
                                            Focus Mode
                                        </span>
                                        <span className="sm:hidden inline-flex items-center">
                                            Focus
                                        </span>
                                    </PrimaryButton>
                                </div>
                            </>
                        )}

                        {isRunning && (
                            <>
                                <div className="flex gap-2">
                                    <SecondaryButton
                                        onClick={pauseTimer}
                                        className="flex-1 text-sm sm:text-base py-2 sm:py-2.5 justify-center hover:scale-105 transition-transform duration-200"
                                    >
                                        <span className="inline-flex items-center">
                                            Pause
                                        </span>
                                    </SecondaryButton>
                                    <PrimaryButton
                                        onClick={handleStartFocus}
                                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-sm sm:text-base py-2 sm:py-2.5 justify-center hover:scale-105 transition-transform duration-200"
                                    >
                                        <span className="hidden sm:inline inline-flex items-center">
                                            Focus Mode
                                        </span>
                                        <span className="sm:hidden inline-flex items-center">
                                            Focus
                                        </span>
                                    </PrimaryButton>
                                </div>
                            </>
                        )}

                        {isPaused && (
                            <>
                                <div className="flex gap-2">
                                    <PrimaryButton
                                        onClick={startTimer}
                                        className="flex-1 text-sm sm:text-base py-2 sm:py-2.5 justify-center hover:scale-105 transition-transform duration-200"
                                    >
                                        <span className="inline-flex items-center">
                                            Resume
                                        </span>
                                    </PrimaryButton>
                                    <PrimaryButton
                                        onClick={handleStartFocus}
                                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-sm sm:text-base py-2 sm:py-2.5 justify-center hover:scale-105 transition-transform duration-200"
                                    >
                                        <span className="hidden sm:inline inline-flex items-center">
                                            Focus Mode
                                        </span>
                                        <span className="sm:hidden inline-flex items-center">
                                            Focus
                                        </span>
                                    </PrimaryButton>
                                </div>
                            </>
                        )}

                        {!isIdle && (
                            <div className="flex justify-center">
                                <DangerButton
                                    onClick={resetTimer}
                                    className="px-4 sm:px-6 text-sm sm:text-base py-2 sm:py-2.5 justify-center hover:scale-105 transition-transform duration-200"
                                >
                                    <span className="inline-flex items-center">
                                        Reset
                                    </span>
                                </DangerButton>
                            </div>
                        )}
                    </div>

                    {/* Tips */}
                    <div className="mt-3 sm:mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
                        💡{" "}
                        <span className="hidden sm:inline">
                            Use Focus Mode for distraction-free sessions
                        </span>
                        <span className="sm:hidden">
                            Focus Mode = distraction-free
                        </span>
                    </div>
                </div>
            ) : (
                <button
                    onClick={toggleExpanded}
                    className={`
                        ${getSessionColor()}
                        text-white rounded-full p-3 sm:p-4 shadow-lg transition-all duration-300 
                        hover:scale-110 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-opacity-50
                        ${isRunning ? "animate-pulse" : ""}
                        ${isPaused ? "animate-bounce" : ""}
                        ${
                            currentSession === "work"
                                ? "focus:ring-red-500"
                                : currentSession === "short_break"
                                ? "focus:ring-green-500"
                                : "focus:ring-blue-500"
                        }
                    `}
                    title={`Pomodoro Timer - ${formatTime(timeLeft)}`}
                    style={{
                        animation: isRunning
                            ? "breathe 2s ease-in-out infinite"
                            : isPaused
                            ? "wiggle 0.5s ease-in-out infinite alternate"
                            : "none",
                    }}
                >
                    <div className="relative">
                        {/* Timer Icon */}
                        <svg
                            className="w-5 h-5 sm:w-6 sm:h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>

                        {/* Running indicator */}
                        {isRunning && (
                            <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full animate-ping"></div>
                        )}

                        {/* Paused indicator */}
                        {isPaused && (
                            <div
                                className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-yellow-400 rounded-full animate-bounce"
                                style={{ animationDelay: "0.5s" }}
                            ></div>
                        )}
                    </div>

                    {/* Time display on hover - hidden on mobile */}
                    <div className="hidden sm:block absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        {formatTime(timeLeft)}
                    </div>
                </button>
            )}
        </div>
    );
}

import React, { useEffect } from "react";
import { usePomodoro } from "./PomodoroContext";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import DangerButton from "@/Components/DangerButton";

export default function FocusMode() {
    const {
        focusMode,
        setFocusMode,
        timeLeft,
        formatTime,
        isRunning,
        isPaused,
        isIdle,
        startTimer,
        pauseTimer,
        resetTimer,
        currentSession,
        sessionsCompleted,
        getProgress,
    } = usePomodoro();

    // Prevent scrolling when in focus mode
    useEffect(() => {
        if (focusMode) {
            document.body.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = "unset";
            };
        }
    }, [focusMode]);

    // Handle escape key to exit focus mode
    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === "Escape" && focusMode) {
                setFocusMode(false);
            }
        };

        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [focusMode, setFocusMode]);

    if (!focusMode) {
        return null;
    }

    const getSessionInfo = () => {
        switch (currentSession) {
            case "work":
                return {
                    title: "Focus Session",
                    subtitle: "Time to concentrate and get things done",
                    bgGradient: "from-red-400 to-red-600",
                    accentColor: "text-red-100",
                };
            case "short_break":
                return {
                    title: "Short Break",
                    subtitle: "Take a moment to relax and recharge",
                    bgGradient: "from-green-400 to-green-600",
                    accentColor: "text-green-100",
                };
            case "long_break":
                return {
                    title: "Long Break",
                    subtitle: "Great job! Take a well-deserved longer break",
                    bgGradient: "from-blue-400 to-blue-600",
                    accentColor: "text-blue-100",
                };
            default:
                return {
                    title: "Focus Session",
                    subtitle: "Time to concentrate and get things done",
                    bgGradient: "from-red-400 to-red-600",
                    accentColor: "text-red-100",
                };
        }
    };

    const sessionInfo = getSessionInfo();

    const handleCancelFocus = () => {
        setFocusMode(false);
    };

    return (
        <div
            className={`fixed inset-0 z-[9999] bg-gradient-to-br ${sessionInfo.bgGradient} flex items-center justify-center`}
            style={{
                animation: "fadeIn 0.5s ease-out",
            }}
        >
            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
                @keyframes zoomIn {
                    from {
                        transform: scale(0.8);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
                @keyframes float {
                    0%,
                    100% {
                        transform: translateY(0px);
                    }
                    50% {
                        transform: translateY(-10px);
                    }
                }
                @keyframes glow {
                    0%,
                    100% {
                        box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
                    }
                    50% {
                        box-shadow: 0 0 40px rgba(255, 255, 255, 0.6);
                    }
                }
                @keyframes sparkle {
                    0%,
                    100% {
                        opacity: 0;
                        transform: scale(0);
                    }
                    50% {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
            `}</style>
            <div
                className="text-center text-white px-4 sm:px-8 w-full max-w-4xl mx-auto"
                style={{
                    animation: "zoomIn 0.6s ease-out",
                }}
            >
                {/* Cancel button */}
                <button
                    onClick={handleCancelFocus}
                    className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/80 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                    title="Exit Focus Mode (ESC)"
                >
                    <svg
                        className="w-6 h-6 sm:w-8 sm:h-8"
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

                {/* Session info */}
                <div className="mb-6 sm:mb-8">
                    <h1
                        className="text-3xl sm:text-4xl md:text-6xl font-bold mb-2 sm:mb-4 leading-tight"
                        style={{ animation: "float 3s ease-in-out infinite" }}
                    >
                        {currentSession === "work"
                            ? "🎯"
                            : currentSession === "short_break"
                            ? "☕"
                            : "🏖️"}{" "}
                        {sessionInfo.title}
                    </h1>
                    <p
                        className={`text-lg sm:text-xl md:text-2xl ${sessionInfo.accentColor} opacity-90 px-2`}
                        style={{
                            animation: "float 3s ease-in-out infinite 0.5s",
                        }}
                    >
                        {sessionInfo.subtitle}
                    </p>
                </div>

                {/* Main timer display */}
                <div className="mb-8 sm:mb-12">
                    <div
                        className="text-6xl sm:text-8xl md:text-9xl font-mono font-bold mb-4 sm:mb-6 tracking-wider"
                        style={{
                            animation: isRunning
                                ? "glow 2s ease-in-out infinite"
                                : "none",
                            textShadow: "0 0 20px rgba(255, 255, 255, 0.5)",
                        }}
                    >
                        {formatTime(timeLeft)}
                    </div>

                    {/* Progress circle */}
                    <div className="flex justify-center mb-4 sm:mb-6">
                        <div
                            className="relative w-24 h-24 sm:w-32 sm:h-32"
                            style={{
                                animation: "float 4s ease-in-out infinite",
                            }}
                        >
                            <svg
                                className="w-24 h-24 sm:w-32 sm:h-32 transform -rotate-90"
                                viewBox="0 0 100 100"
                            >
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    stroke="currentColor"
                                    strokeWidth="6"
                                    fill="transparent"
                                    className="text-white/20"
                                />
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    stroke="currentColor"
                                    strokeWidth="6"
                                    fill="transparent"
                                    strokeDasharray={`${2 * Math.PI * 45}`}
                                    strokeDashoffset={`${
                                        2 *
                                        Math.PI *
                                        45 *
                                        (1 - getProgress() / 100)
                                    }`}
                                    className="text-white transition-all duration-1000 ease-out"
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-white/80 text-xs sm:text-sm font-medium">
                                    {Math.round(getProgress())}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-6 sm:mb-8 px-4">
                    {isIdle && (
                        <button
                            onClick={startTimer}
                            className="bg-white/20 hover:bg-white/30 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold transition-all duration-200 hover:scale-110 backdrop-blur-sm shadow-lg hover:shadow-2xl"
                            style={{
                                animation: "sparkle 2s ease-in-out infinite",
                            }}
                        >
                            <span className="inline-flex items-center gap-2">
                                ▶️ Start Timer
                            </span>
                        </button>
                    )}

                    {isRunning && (
                        <button
                            onClick={pauseTimer}
                            className="bg-white/20 hover:bg-white/30 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold transition-all duration-200 hover:scale-110 backdrop-blur-sm shadow-lg hover:shadow-2xl"
                        >
                            <span className="inline-flex items-center gap-2">
                                ⏸️ Pause
                            </span>
                        </button>
                    )}

                    {isPaused && (
                        <button
                            onClick={startTimer}
                            className="bg-white/20 hover:bg-white/30 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold transition-all duration-200 hover:scale-110 backdrop-blur-sm shadow-lg hover:shadow-2xl"
                            style={{
                                animation: "sparkle 2s ease-in-out infinite",
                            }}
                        >
                            <span className="inline-flex items-center gap-2">
                                ▶️ Resume
                            </span>
                        </button>
                    )}

                    {!isIdle && (
                        <button
                            onClick={resetTimer}
                            className="bg-white/10 hover:bg-white/20 text-white/80 hover:text-white px-5 sm:px-6 py-3 sm:py-4 rounded-full text-sm sm:text-base font-semibold transition-all duration-200 hover:scale-110 backdrop-blur-sm shadow-lg hover:shadow-2xl"
                        >
                            <span className="inline-flex items-center gap-2">
                                🔄 Reset
                            </span>
                        </button>
                    )}
                </div>

                {/* Session stats */}
                <div className="text-white/80 mb-4 sm:mb-0">
                    <p className="text-base sm:text-lg">
                        Sessions completed today:{" "}
                        <span className="font-bold text-white">
                            {sessionsCompleted}
                        </span>
                    </p>
                </div>

                {/* Keyboard shortcuts */}
                <div className="absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 text-white/60 text-xs sm:text-sm text-center px-4">
                    Press{" "}
                    <kbd className="px-2 py-1 bg-white/10 rounded text-xs">
                        ESC
                    </kbd>{" "}
                    to exit focus mode
                </div>
            </div>
        </div>
    );
}

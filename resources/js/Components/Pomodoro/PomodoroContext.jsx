import { router } from "@inertiajs/react";
import React, {
    createContext,
    useContext,
    useReducer,
    useEffect,
    useRef,
} from "react";

const PomodoroContext = createContext();

/**
 * Collision-resistant idempotency id for a pomodoro session. Prefers the
 * platform UUID generator, falling back where it isn't available.
 */
function newClientRequestId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// Timer states
const TIMER_STATES = {
    IDLE: "idle",
    RUNNING: "running",
    PAUSED: "paused",
    BREAK: "break",
    BREAK_RUNNING: "break_running",
    BREAK_PAUSED: "break_paused",
};

// Default timer durations (in seconds)
const DEFAULT_DURATIONS = {
    WORK: 20 * 60, // 20 minutes
    SHORT_BREAK: 5 * 60, // 5 minutes
    LONG_BREAK: 15 * 60, // 15 minutes
};

const initialState = {
    state: TIMER_STATES.IDLE,
    timeLeft: DEFAULT_DURATIONS.WORK,
    totalTime: DEFAULT_DURATIONS.WORK,
    focusMode: false,
    sessionsCompleted: 0,
    currentSession: "work", // 'work', 'short_break', 'long_break'
    isExpanded: false, // For floating widget
    originalTitle: document.title,
};

function pomodoroReducer(state, action) {
    switch (action.type) {
        case "START_TIMER":
            return {
                ...state,
                state:
                    state.currentSession === "work"
                        ? TIMER_STATES.RUNNING
                        : TIMER_STATES.BREAK_RUNNING,
            };

        case "PAUSE_TIMER":
            return {
                ...state,
                state:
                    state.currentSession === "work"
                        ? TIMER_STATES.PAUSED
                        : TIMER_STATES.BREAK_PAUSED,
            };

        case "RESET_TIMER":
            const duration =
                state.currentSession === "work"
                    ? DEFAULT_DURATIONS.WORK
                    : state.currentSession === "short_break"
                    ? DEFAULT_DURATIONS.SHORT_BREAK
                    : DEFAULT_DURATIONS.LONG_BREAK;

            return {
                ...state,
                state: TIMER_STATES.IDLE,
                timeLeft: duration,
                totalTime: duration,
                focusMode: false,
            };

        case "TICK":
            const newTimeLeft = Math.max(0, state.timeLeft - 1);
            if (newTimeLeft === 0) {
                // Timer completed
                if (state.currentSession === "work") {
                    const newSessionsCompleted = state.sessionsCompleted + 1;
                    const nextSession =
                        newSessionsCompleted % 4 === 0
                            ? "long_break"
                            : "short_break";
                    const nextDuration =
                        nextSession === "long_break"
                            ? DEFAULT_DURATIONS.LONG_BREAK
                            : DEFAULT_DURATIONS.SHORT_BREAK;

                    return {
                        ...state,
                        state: TIMER_STATES.BREAK,
                        timeLeft: nextDuration,
                        totalTime: nextDuration,
                        sessionsCompleted: newSessionsCompleted,
                        currentSession: nextSession,
                        focusMode: false,
                    };
                } else {
                    // Break completed, back to work
                    return {
                        ...state,
                        state: TIMER_STATES.IDLE,
                        timeLeft: DEFAULT_DURATIONS.WORK,
                        totalTime: DEFAULT_DURATIONS.WORK,
                        currentSession: "work",
                        focusMode: false,
                    };
                }
            }

            return {
                ...state,
                timeLeft: newTimeLeft,
            };

        case "TOGGLE_FOCUS_MODE":
            return {
                ...state,
                focusMode: !state.focusMode,
            };

        case "SET_FOCUS_MODE":
            return {
                ...state,
                focusMode: action.payload,
            };

        case "TOGGLE_EXPANDED":
            return {
                ...state,
                isExpanded: !state.isExpanded,
            };

        case "SET_EXPANDED":
            return {
                ...state,
                isExpanded: action.payload,
            };

        case "LOAD_STATE":
            return {
                ...state,
                ...action.payload,
            };

        default:
            return state;
    }
}

export function PomodoroProvider({ children }) {
    const [state, dispatch] = useReducer(pomodoroReducer, initialState);
    const intervalRef = useRef(null);
    const audioRef = useRef(null);
    // Tracks the in-flight work session so points are awarded once, server-side,
    // when it completes naturally. Holds { clientRequestId, startedAt, durationSeconds }.
    const workSessionRef = useRef(null);

    // Load state from localStorage on mount
    useEffect(() => {
        const savedState = localStorage.getItem("pomodoroState");
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                dispatch({ type: "LOAD_STATE", payload: parsed });
            } catch (error) {
                console.error("Failed to load pomodoro state:", error);
            }
        }
    }, []);

    // Save state to localStorage whenever it changes
    useEffect(() => {
        const stateToSave = {
            sessionsCompleted: state.sessionsCompleted,
            currentSession: state.currentSession,
        };
        localStorage.setItem("pomodoroState", JSON.stringify(stateToSave));
    }, [state.sessionsCompleted, state.currentSession]);

    // Handle timer ticking
    useEffect(() => {
        if (
            state.state === TIMER_STATES.RUNNING ||
            state.state === TIMER_STATES.BREAK_RUNNING
        ) {
            intervalRef.current = setInterval(() => {
                dispatch({ type: "TICK" });
            }, 1000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [state.state]);

    // Update document title
    useEffect(() => {
        if (
            state.state === TIMER_STATES.RUNNING ||
            state.state === TIMER_STATES.BREAK_RUNNING
        ) {
            const minutes = Math.floor(state.timeLeft / 60);
            const seconds = state.timeLeft % 60;
            const timeString = `${minutes.toString().padStart(2, "0")}:${seconds
                .toString()
                .padStart(2, "0")}`;
            const sessionType =
                state.currentSession === "work" ? "Focus" : "Break";
            document.title = `(${timeString}) ${sessionType} - Improved Todo App`;
        } else {
            document.title = state.originalTitle;
        }
    }, [
        state.timeLeft,
        state.state,
        state.currentSession,
        state.originalTitle,
    ]);

    // Play sound when timer completes
    useEffect(() => {
        if (
            state.timeLeft === 0 &&
            (state.state === TIMER_STATES.BREAK ||
                state.state === TIMER_STATES.IDLE)
        ) {
            // Create a simple beep sound
            try {
                const audioContext = new (window.AudioContext ||
                    window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.value = 800;
                oscillator.type = "sine";

                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(
                    0.01,
                    audioContext.currentTime + 1
                );

                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 1);
            } catch (error) {
                console.log("Audio not supported or blocked");
            }
        }
    }, [state.timeLeft, state.state]);

    // Award points server-side when a WORK session completes naturally.
    // The reducer flips a finished work session to the BREAK state (manual
    // resets/skips go to IDLE instead, so they never award). An idempotency id
    // is minted once per session start and reused on retries.
    useEffect(() => {
        // A fresh work session began — capture id + start time once. Resuming
        // from pause keeps the same id (the ref is still set), so no re-award.
        if (
            state.state === TIMER_STATES.RUNNING &&
            state.currentSession === "work" &&
            !workSessionRef.current
        ) {
            workSessionRef.current = {
                clientRequestId: newClientRequestId(),
                startedAt: new Date().toISOString(),
                durationSeconds: state.totalTime,
            };
            return;
        }

        // Work session finished naturally → record it so the backend awards points.
        if (state.state === TIMER_STATES.BREAK && workSessionRef.current) {
            const session = workSessionRef.current;
            workSessionRef.current = null;

            try {
                router.post(
                    route("pomodoro.sessions.store"),
                    {
                        type: "work",
                        duration_seconds: session.durationSeconds,
                        started_at: session.startedAt,
                        completed_at: new Date().toISOString(),
                        client_request_id: session.clientRequestId,
                    },
                    {
                        preserveState: true,
                        preserveScroll: true,
                        only: ["auth"],
                    }
                );
            } catch (error) {
                // Never let points wiring disrupt the timer experience.
                console.error("Failed to record pomodoro session:", error);
            }
            return;
        }

        // Manual reset/skip during a work session (goes IDLE): drop the pending
        // session so nothing is awarded and the next session mints a fresh id.
        if (state.state === TIMER_STATES.IDLE && workSessionRef.current) {
            workSessionRef.current = null;
        }
    }, [state.state, state.currentSession, state.totalTime]);

    const actions = {
        startTimer: () => dispatch({ type: "START_TIMER" }),
        pauseTimer: () => dispatch({ type: "PAUSE_TIMER" }),
        resetTimer: () => dispatch({ type: "RESET_TIMER" }),
        toggleFocusMode: () => dispatch({ type: "TOGGLE_FOCUS_MODE" }),
        setFocusMode: (enabled) =>
            dispatch({ type: "SET_FOCUS_MODE", payload: enabled }),
        toggleExpanded: () => dispatch({ type: "TOGGLE_EXPANDED" }),
        setExpanded: (expanded) =>
            dispatch({ type: "SET_EXPANDED", payload: expanded }),
    };

    const value = {
        ...state,
        ...actions,
        isRunning:
            state.state === TIMER_STATES.RUNNING ||
            state.state === TIMER_STATES.BREAK_RUNNING,
        isPaused:
            state.state === TIMER_STATES.PAUSED ||
            state.state === TIMER_STATES.BREAK_PAUSED,
        isIdle:
            state.state === TIMER_STATES.IDLE ||
            state.state === TIMER_STATES.BREAK,
        formatTime: (seconds) => {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins.toString().padStart(2, "0")}:${secs
                .toString()
                .padStart(2, "0")}`;
        },
        getProgress: () => {
            return ((state.totalTime - state.timeLeft) / state.totalTime) * 100;
        },
    };

    return (
        <PomodoroContext.Provider value={value}>
            {children}
        </PomodoroContext.Provider>
    );
}

export function usePomodoro() {
    const context = useContext(PomodoroContext);
    if (!context) {
        throw new Error("usePomodoro must be used within a PomodoroProvider");
    }
    return context;
}

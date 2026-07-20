import Modal from "@/Components/Modal";
import { AnimatePresence, motion } from "framer-motion";
import {
    CalendarDays,
    CheckSquare,
    Sparkles,
    TrendingUp,
    Wallet,
    X,
} from "lucide-react";
import { useState } from "react";

export const APP_WELCOME_SLIDES = [
    {
        icon: Sparkles,
        title: "Meet Wevie 👋",
        body: "Your day and your money, together in one calm place. Plan what matters, track where your cash goes, and see your progress — without juggling five different apps.",
    },
    {
        icon: CheckSquare,
        title: "Never drop a task again",
        body: "Capture everything with subtasks, tags, reminders, and recurring schedules. Wevie resurfaces each task at the right moment, so your head stays clear.",
    },
    {
        icon: CalendarDays,
        title: "See your whole week at a glance",
        body: "Boards for projects, a calendar for your commitments. Drag, plan, and watch your week come together — solo or with collaborators.",
    },
    {
        icon: Wallet,
        title: "Money that stays in check",
        body: "WevieWallet tracks accounts, budgets, savings goals, and loans right alongside your tasks. Know what's coming before it hits.",
    },
    {
        icon: TrendingUp,
        title: "Ready to make it yours?",
        body: "Take a quick 60-second tour and we'll show you around. You can always replay it later from your profile menu.",
        isFinal: true,
    },
];

/**
 * First-run welcome carousel. Communicates what a part of the app is and its
 * benefits before a spotlight tour begins. Reused for both the whole app and
 * standalone entities (e.g. WevieWallet) by passing a different `slides` set.
 * Dismissal + "Take the tour" are wired by the caller to persist a tutorial
 * key so it only ever shows once.
 */
export default function WelcomeModal({
    show,
    onDismiss,
    onTakeTour,
    slides = APP_WELCOME_SLIDES,
    tourCtaLabel = "Take the tour →",
}) {
    const [slide, setSlide] = useState(0);
    const [direction, setDirection] = useState(1);

    const isFirst = slide === 0;
    const isLast = slide === slides.length - 1;
    const current = slides[slide];
    const Icon = current.icon;

    const go = (delta) => {
        setDirection(delta);
        setSlide((s) => Math.min(slides.length - 1, Math.max(0, s + delta)));
    };

    const jumpTo = (i) => {
        setDirection(i > slide ? 1 : -1);
        setSlide(i);
    };

    return (
        <Modal show={show} maxWidth="lg" closeable onClose={onDismiss} alignTop>
            <div className="relative p-8">
                <button
                    type="button"
                    onClick={onDismiss}
                    aria-label="Skip welcome"
                    className="absolute right-4 top-4 rounded-full p-1.5 text-light-muted transition-colors hover:bg-light-hover hover:text-light-primary dark:text-dark-muted dark:hover:bg-dark-hover dark:hover:text-dark-primary"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="overflow-hidden">
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={slide}
                            custom={direction}
                            initial={{ opacity: 0, x: direction * 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: direction * -40 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="flex flex-col items-center text-center"
                        >
                            <motion.div
                                initial={{ scale: 0.7, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{
                                    delay: 0.05,
                                    type: "spring",
                                    stiffness: 260,
                                    damping: 18,
                                }}
                                className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-400 to-[#5FDDE0] shadow-lg shadow-primary-400/30"
                            >
                                <Icon className="h-10 w-10 text-white" strokeWidth={1.75} />
                            </motion.div>

                            <h2 className="text-xl font-bold text-light-primary dark:text-dark-primary">
                                {current.title}
                            </h2>
                            <p className="mt-3 max-w-sm text-sm leading-relaxed text-light-secondary dark:text-dark-secondary">
                                {current.body}
                            </p>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Dot indicators */}
                <div className="mt-8 flex items-center justify-center gap-2">
                    {slides.map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            aria-label={`Go to slide ${i + 1}`}
                            onClick={() => jumpTo(i)}
                            className={`h-2 rounded-full transition-all ${
                                i === slide
                                    ? "w-6 bg-primary-400"
                                    : "w-2 bg-slate-300 hover:bg-primary-300 dark:bg-white/25 dark:hover:bg-primary-400/60"
                            }`}
                        />
                    ))}
                </div>

                {/* Controls */}
                <div className="mt-6 flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={onDismiss}
                        className="rounded-md px-3 py-2 text-xs font-medium text-light-muted transition-colors hover:text-light-primary dark:text-dark-muted dark:hover:text-dark-primary"
                    >
                        Skip for now
                    </button>

                    <div className="flex items-center gap-2">
                        {!isFirst && (
                            <button
                                type="button"
                                onClick={() => go(-1)}
                                className="rounded-md border border-light-border/70 px-4 py-2 text-xs font-semibold text-light-secondary transition-colors hover:bg-light-hover dark:border-white/10 dark:text-dark-secondary dark:hover:bg-dark-hover"
                            >
                                Back
                            </button>
                        )}
                        {isLast ? (
                            <button
                                type="button"
                                onClick={onTakeTour}
                                className="rounded-md bg-primary-400 px-5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-primary-500 dark:bg-[#2ED7A1] dark:hover:bg-primary-400"
                            >
                                {tourCtaLabel}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => go(1)}
                                className="rounded-md bg-primary-400 px-5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-primary-500 dark:bg-[#2ED7A1] dark:hover:bg-primary-400"
                            >
                                Next
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
}

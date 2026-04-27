export default function TourTooltip({
    step,
    backProps,
    primaryProps,
    skipProps,
    closeProps,
    tooltipProps,
    isLastStep,
    index,
    size,
}) {
    return (
        <div
            {...tooltipProps}
            className="w-[min(92vw,360px)] rounded-2xl border border-light-border/70 bg-white p-5 shadow-2xl ring-1 ring-black/5 dark:border-white/10 dark:bg-dark-card dark:ring-white/5"
        >
            <button
                type="button"
                {...closeProps}
                aria-label="Close tour"
                className="absolute right-3 top-3 rounded-full p-1 text-light-muted hover:bg-light-hover hover:text-light-primary dark:text-dark-muted dark:hover:bg-dark-hover dark:hover:text-dark-primary"
            >
                <svg
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 6l8 8M14 6l-8 8"
                    />
                </svg>
            </button>

            {step.title && (
                <h3 className="pr-6 text-base font-semibold text-light-primary dark:text-dark-primary">
                    {step.title}
                </h3>
            )}

            <div className="mt-2 text-sm leading-relaxed text-light-secondary dark:text-dark-secondary">
                {step.content}
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-light-muted dark:text-dark-muted">
                    {index + 1} / {size}
                </span>
                <div className="flex items-center gap-2">
                    {!step.hideSkip && skipProps && (
                        <button
                            type="button"
                            {...skipProps}
                            className="rounded-md px-3 py-1.5 text-xs font-medium text-light-muted hover:text-light-primary dark:text-dark-muted dark:hover:text-dark-primary"
                        >
                            Skip
                        </button>
                    )}
                    {index > 0 && backProps && (
                        <button
                            type="button"
                            {...backProps}
                            className="rounded-md border border-light-border/70 px-3 py-1.5 text-xs font-semibold text-light-secondary hover:bg-light-hover dark:border-white/10 dark:text-dark-secondary dark:hover:bg-dark-hover"
                        >
                            Back
                        </button>
                    )}
                    <button
                        type="button"
                        {...primaryProps}
                        className="rounded-md bg-primary-400 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-primary-500 dark:bg-[#2ED7A1] dark:hover:bg-primary-400"
                    >
                        {isLastStep ? "Done" : "Next"}
                    </button>
                </div>
            </div>
        </div>
    );
}

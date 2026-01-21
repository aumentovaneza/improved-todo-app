export default function SecondaryButton({
    type = "button",
    className = "",
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            type={type}
            className={
                `inline-flex items-center rounded-xl border border-light-border/70 bg-white px-4 py-2 text-sm font-medium text-light-primary shadow-sm transition-colors duration-200 hover:bg-light-hover focus:outline-none focus:ring-2 focus:ring-wevie-teal/30 focus:ring-offset-2 disabled:opacity-40 dark:border-dark-border/70 dark:bg-dark-card dark:text-dark-primary dark:hover:bg-dark-hover ${
                    disabled && "opacity-40"
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}

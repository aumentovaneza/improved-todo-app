export default function PrimaryButton({
    className = "",
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center rounded-xl border border-transparent bg-gradient-to-r from-wevie-teal to-wevie-mint px-4 py-2 text-sm font-medium text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-wevie-teal/40 focus:ring-offset-2 dark:from-wevie-teal dark:to-wevie-mint ${
                    disabled && "opacity-40"
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}

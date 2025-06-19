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
                `inline-flex items-center rounded-md border border-transparent bg-primary-500 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-200 ease-in-out hover:bg-primary-600 focus:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 active:bg-primary-700 dark:bg-primary-600 dark:text-white dark:hover:bg-primary-700 dark:focus:bg-primary-700 dark:focus:ring-offset-dark-primary dark:active:bg-primary-800 ${
                    disabled && "opacity-25"
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}

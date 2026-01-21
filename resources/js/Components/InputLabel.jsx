export default function InputLabel({
    value,
    className = "",
    children,
    ...props
}) {
    return (
        <label
            {...props}
            className={
                `block text-sm font-medium text-light-secondary dark:text-dark-secondary ` +
                className
            }
        >
            {value ? value : children}
        </label>
    );
}

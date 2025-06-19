import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export default forwardRef(function TextInput(
    { type = "text", className = "", isFocused = false, ...props },
    ref
) {
    const localRef = useRef(null);

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused) {
            localRef.current?.focus();
        }
    }, [isFocused]);

    return (
        <input
            {...props}
            type={type}
            className={
                "rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-dark-border dark:bg-dark-card dark:text-dark-primary dark:focus:border-primary-400 dark:focus:ring-primary-400 transition-colors duration-200 " +
                className
            }
            ref={localRef}
        />
    );
});

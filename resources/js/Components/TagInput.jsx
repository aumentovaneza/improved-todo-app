import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

export default function TagInput({
    value = [],
    onChange,
    placeholder = "Type and press space or comma to add tags...",
    maxTags = 10,
    className = "",
    disabled = false,
}) {
    const [inputValue, setInputValue] = useState("");
    const [tags, setTags] = useState(value);
    const inputRef = useRef(null);

    useEffect(() => {
        setTags(value);
    }, [value]);

    const generateTagColor = (tagName) => {
        // Generate a consistent color based on tag name
        const colors = [
            "#3B82F6",
            "#EF4444",
            "#10B981",
            "#F59E0B",
            "#8B5CF6",
            "#F97316",
            "#06B6D4",
            "#84CC16",
            "#EC4899",
            "#6B7280",
        ];
        let hash = 0;
        for (let i = 0; i < tagName.length; i++) {
            hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const addTag = (tagText) => {
        const trimmedTag = tagText.trim();
        if (
            trimmedTag &&
            !tags.some((tag) => tag.name === trimmedTag) &&
            tags.length < maxTags
        ) {
            const newTag = {
                name: trimmedTag,
                color: generateTagColor(trimmedTag),
                description: null,
                is_new: true, // Mark as new for backend processing
            };
            const newTags = [...tags, newTag];
            setTags(newTags);
            onChange(newTags);
        }
        setInputValue("");
    };

    const removeTag = (indexToRemove) => {
        const newTags = tags.filter((_, index) => index !== indexToRemove);
        setTags(newTags);
        onChange(newTags);
    };

    const handleKeyDown = (e) => {
        if (disabled) return;

        if (e.key === " " || e.key === "," || e.key === "Enter") {
            e.preventDefault();
            if (inputValue.trim()) {
                addTag(inputValue);
            }
        } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
            removeTag(tags.length - 1);
        }
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        // Don't allow spaces or commas in the input, they should trigger tag creation
        if (value.includes(" ") || value.includes(",")) {
            const tagText = value.replace(/[, ]+/g, "");
            if (tagText) {
                addTag(tagText);
            }
        } else {
            setInputValue(value);
        }
    };

    const handleContainerClick = () => {
        if (!disabled && inputRef.current) {
            inputRef.current.focus();
        }
    };

    return (
        <div>
            <div
                className={`min-h-[42px] w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus-within:ring-blue-500 focus-within:border-blue-500 dark:bg-gray-700 cursor-text ${
                    disabled
                        ? "bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                        : ""
                } ${className}`}
                onClick={handleContainerClick}
            >
                <div className="flex flex-wrap gap-2 items-center">
                    {tags.map((tag, index) => (
                        <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: tag.color }}
                        >
                            {tag.name}
                            {!disabled && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeTag(index);
                                    }}
                                    className="ml-1 hover:bg-black hover:bg-opacity-20 rounded-full p-0.5 transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </span>
                    ))}
                    {!disabled && tags.length < maxTags && (
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder={tags.length === 0 ? placeholder : ""}
                            className="flex-1 min-w-[120px] bg-transparent border-0 outline-none focus:ring-0 focus:border-0 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 p-0 m-0"
                            style={{ boxShadow: "none" }}
                        />
                    )}
                </div>
            </div>
            {tags.length >= maxTags && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Maximum {maxTags} tags allowed
                </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Press space, comma, or Enter to add a tag
            </p>
        </div>
    );
}

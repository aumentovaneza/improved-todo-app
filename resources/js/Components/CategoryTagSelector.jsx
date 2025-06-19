import { useState, useEffect } from "react";
import { Check } from "lucide-react";

export default function CategoryTagSelector({
    categoryId,
    categories = [],
    selectedTags = [],
    onChange,
    className = "",
}) {
    const [availableTags, setAvailableTags] = useState([]);

    useEffect(() => {
        if (categoryId && categories.length > 0) {
            const selectedCategory = categories.find(
                (cat) => cat.id == categoryId
            );
            if (selectedCategory && selectedCategory.tags) {
                setAvailableTags(selectedCategory.tags);
            } else {
                setAvailableTags([]);
            }
        } else {
            setAvailableTags([]);
        }
    }, [categoryId, categories]);

    const isTagSelected = (tag) => {
        return selectedTags.some(
            (selectedTag) =>
                (selectedTag.id && selectedTag.id === tag.id) ||
                selectedTag.name === tag.name
        );
    };

    const toggleTag = (tag) => {
        const isSelected = isTagSelected(tag);
        let newSelectedTags;

        if (isSelected) {
            // Remove tag
            newSelectedTags = selectedTags.filter(
                (selectedTag) =>
                    !(selectedTag.id && selectedTag.id === tag.id) &&
                    selectedTag.name !== tag.name
            );
        } else {
            // Add tag
            newSelectedTags = [
                ...selectedTags,
                {
                    id: tag.id,
                    name: tag.name,
                    color: tag.color,
                    description: tag.description,
                    is_new: false,
                },
            ];
        }

        onChange(newSelectedTags);
    };

    // Don't render if no category is selected or no tags available
    if (!categoryId || availableTags.length === 0) {
        return null;
    }

    return (
        <div className={className}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Available Tags from Category
            </label>
            <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => {
                    const selected = isTagSelected(tag);
                    return (
                        <button
                            key={tag.id}
                            type="button"
                            onClick={() => toggleTag(tag)}
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                                selected
                                    ? "text-white shadow-md transform scale-105"
                                    : "text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600"
                            }`}
                            style={
                                selected ? { backgroundColor: tag.color } : {}
                            }
                        >
                            {selected && <Check className="h-3 w-3 mr-1" />}
                            {tag.name}
                        </button>
                    );
                })}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Click to select/deselect tags from this category
            </p>
        </div>
    );
}

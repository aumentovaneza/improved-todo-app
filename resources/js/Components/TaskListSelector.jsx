import { Check } from "lucide-react";

export default function TaskListSelector({
    lists = [],
    selectedLists = [],
    onChange,
    className = "",
}) {
    const isListSelected = (list) => {
        return selectedLists.some(
            (selected) => (selected.id && selected.id === list.id) || selected.name === list.name
        );
    };

    const toggleList = (list) => {
        const isSelected = isListSelected(list);
        let newSelectedLists;

        if (isSelected) {
            newSelectedLists = selectedLists.filter(
                (selected) =>
                    !(selected.id && selected.id === list.id) && selected.name !== list.name
            );
        } else {
            newSelectedLists = [
                ...selectedLists,
                {
                    id: list.id,
                    name: list.name,
                    color: list.color,
                },
            ];
        }

        onChange(newSelectedLists);
    };

    // Nothing to pick from — don't render an empty control.
    if (!lists || lists.length === 0) {
        return null;
    }

    return (
        <div className={className}>
            <label className="block text-sm font-medium mb-2 text-light-secondary dark:text-dark-secondary">
                Attach to lists (optional)
            </label>
            <div className="flex flex-wrap gap-2">
                {lists.map((list) => {
                    const selected = isListSelected(list);
                    return (
                        <button
                            key={list.id}
                            type="button"
                            onClick={() => toggleList(list)}
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                                selected
                                    ? "text-white shadow-md transform scale-105"
                                    : "text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600"
                            }`}
                            style={selected ? { backgroundColor: list.color } : {}}
                            aria-pressed={selected}
                        >
                            {selected && <Check className="h-3 w-3 mr-1" />}
                            {list.name}
                        </button>
                    );
                })}
            </div>
            <p className="text-xs text-light-muted dark:text-dark-muted mt-1">
                Click to attach or detach this task from a list
            </p>
        </div>
    );
}

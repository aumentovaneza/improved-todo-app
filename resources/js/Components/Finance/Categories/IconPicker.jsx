import { useEffect, useState } from "react";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import Modal from "@/Components/Modal";

export default function IconPicker({ value, onChange }) {
    const [isDark, setIsDark] = useState(() =>
        document.documentElement.classList.contains("dark")
    );
    const [showPicker, setShowPicker] = useState(false);

    const handleClear = () => {
        onChange?.("");
    };

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.classList.contains("dark"));
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });

        return () => observer.disconnect();
    }, []);

    return (
        <div>
            <div className="flex items-center justify-between">
                <label className="text-sm text-slate-500 dark:text-slate-400">
                    Emoji
                </label>
                <button
                    type="button"
                    onClick={handleClear}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100"
                >
                    Clear
                </button>
            </div>
            {value && (
                <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-sm text-slate-600 dark:border-white/10 dark:bg-dark-card/70 dark:text-slate-200">
                    <span className="text-base leading-none">{value}</span>
                </div>
            )}
            {!value && (
                <div className="mt-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-400 dark:border-white/10 dark:bg-dark-card/70 dark:text-slate-500">
                    No emoji selected
                </div>
            )}
            <div className="mt-3 flex items-center justify-between gap-2">
                <button
                    type="button"
                    onClick={() => setShowPicker(true)}
                    className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:border-slate-300 hover:text-slate-700 dark:border-white/10 dark:text-slate-300 dark:hover:text-white"
                >
                    Choose emoji
                </button>
            </div>
            <Modal show={showPicker} onClose={() => setShowPicker(false)} maxWidth="xl">
                <div className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                        <h4 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                            Choose an emoji
                        </h4>
                        <button
                            type="button"
                            onClick={() => setShowPicker(false)}
                            className="text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white"
                        >
                            Close
                        </button>
                    </div>
                    <div className="emoji-picker mt-4 w-full rounded-md border border-slate-200 p-2 dark:border-white/10 dark:bg-dark-card/70">
                        <Picker
                            data={data}
                            theme={isDark ? "dark" : "light"}
                            onEmojiSelect={(emoji) => {
                                onChange?.(emoji?.native ?? "");
                                setShowPicker(false);
                            }}
                            previewPosition="none"
                            style={{ width: "100%", maxWidth: "100%" }}
                            dynamicWidth
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
}

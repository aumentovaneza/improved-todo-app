import { Plus } from "lucide-react";

export default function MobileFab({ onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="fixed z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-wevie-teal to-wevie-mint text-white shadow-soft transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-wevie-teal/50 lg:hidden"
            style={{
                right: "16px",
                bottom: "calc(env(safe-area-inset-bottom, 0px) + 76px)",
            }}
            aria-label="Quick add transaction"
        >
            <Plus className="h-6 w-6" />
        </button>
    );
}

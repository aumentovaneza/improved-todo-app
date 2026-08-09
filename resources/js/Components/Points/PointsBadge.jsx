import { usePage } from "@inertiajs/react";
import { Flame, Sparkles } from "lucide-react";

/**
 * Compact points balance pill, driven by the shared `auth.points` prop
 * ({ balance, streak }). Renders nothing when points aren't shared yet
 * (older cached pages / unauthenticated), so it's safe to drop anywhere.
 */
export default function PointsBadge({ showStreak = true, className = "" }) {
    const points = usePage().props?.auth?.points;
    if (!points) return null;

    const balance = points.balance ?? 0;
    const streak = points.streak ?? 0;

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-2.5 py-1 text-sm font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-200 ${className}`}
            aria-label={`${balance.toLocaleString()} points`}
            title={`${balance.toLocaleString()} points`}
        >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span>{balance.toLocaleString()}</span>
            {showStreak && streak > 0 && (
                <span
                    className="ml-1 inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400"
                    title={`${streak}-day streak`}
                >
                    <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                    {streak}
                </span>
            )}
        </span>
    );
}

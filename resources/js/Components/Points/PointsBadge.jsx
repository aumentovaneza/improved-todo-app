import { Link, usePage } from "@inertiajs/react";
import { Flame, Sparkles } from "lucide-react";

/**
 * Compact points balance pill, driven by the shared `auth.points` prop
 * ({ balance, streak }). Links to the points history page. Renders nothing
 * when points aren't shared yet (older cached pages / unauthenticated), so
 * it's safe to drop anywhere.
 */
export default function PointsBadge({ showStreak = true, className = "" }) {
    const points = usePage().props?.auth?.points;
    if (!points) return null;

    const balance = points.balance ?? 0;
    const streak = points.streak ?? 0;

    const label =
        showStreak && streak > 0
            ? `${balance.toLocaleString()} points, ${streak}-day streak — view history`
            : `${balance.toLocaleString()} points — view history`;

    return (
        <Link
            href={route("points.index")}
            className={`inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-2.5 py-1 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 dark:bg-primary-900/30 dark:text-primary-200 dark:hover:bg-primary-900/50 ${className}`}
            aria-label={label}
            title={label}
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
        </Link>
    );
}

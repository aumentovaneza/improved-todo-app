const BASE = "animate-pulse rounded-md bg-light-hover dark:bg-dark-hover";

function StatSkeleton() {
    return (
        <div className="card p-4 sm:p-5">
            <div className={`h-4 w-20 ${BASE}`} />
            <div className={`mt-3 h-7 w-28 ${BASE}`} />
        </div>
    );
}

function CardSkeleton() {
    return (
        <div className="card space-y-3 p-4">
            <div className={`h-4 w-1/3 ${BASE}`} />
            <div className={`h-3 w-2/3 ${BASE}`} />
            <div className={`h-2 w-full ${BASE}`} />
        </div>
    );
}

function RowSkeleton() {
    return (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-light-border/70 px-4 py-3 dark:border-dark-border/70">
            <div className="flex-1 space-y-2">
                <div className={`h-3 w-1/2 ${BASE}`} />
                <div className={`h-3 w-1/3 ${BASE}`} />
            </div>
            <div className={`h-4 w-16 ${BASE}`} />
        </div>
    );
}

function ChartSkeleton() {
    return (
        <div className="card p-4">
            <div className={`h-4 w-1/4 ${BASE}`} />
            <div className={`mt-4 h-64 w-full ${BASE}`} />
        </div>
    );
}

const VARIANTS = {
    stat: StatSkeleton,
    card: CardSkeleton,
    row: RowSkeleton,
    chart: ChartSkeleton,
};

/**
 * Loading placeholder. `variant` picks the shape, `count` repeats it.
 */
export default function Skeleton({ variant = "row", count = 1, className = "" }) {
    const Item = VARIANTS[variant] ?? RowSkeleton;
    return (
        <div className={`space-y-3 ${className}`}>
            {Array.from({ length: count }).map((_, index) => (
                <Item key={index} />
            ))}
        </div>
    );
}

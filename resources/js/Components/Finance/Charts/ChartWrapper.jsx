import { Card, Title } from "@tremor/react";

/**
 * Consistent shell for the Finance charts: Tremor Card + Title, an optional
 * subtitle, and an actions slot (e.g. a date-range selector) aligned right.
 */
export default function ChartWrapper({ title, subtitle, actions, children, className = "" }) {
    return (
        <Card className={className}>
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                    <Title>{title}</Title>
                    {subtitle && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {subtitle}
                        </p>
                    )}
                </div>
                {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
            {children}
        </Card>
    );
}

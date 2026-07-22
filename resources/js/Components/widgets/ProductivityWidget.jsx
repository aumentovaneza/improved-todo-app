import { AreaChart } from "@tremor/react";
import { Activity } from "lucide-react";
import WidgetFrame from "@/Components/Dashboard/WidgetFrame";
import StatCard from "@/Components/Finance/UI/StatCard";
import EmptyState from "@/Components/Finance/UI/EmptyState";

function humanize(key) {
    return key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Productivity trends. `productivity` carries `trends` (a time series) and a
 * `metrics` object. Trend rows are normalised defensively since the exact keys
 * are backend-owned; the chart plots a single "Completed" series and up to two
 * headline metrics render as StatCards.
 */
export default function ProductivityWidget({ data, dragHandleProps }) {
    const trends = data?.trends ?? [];
    const metrics = data?.metrics ?? {};

    const chartData = trends.map((row, index) => ({
        label: row.label ?? row.date ?? row.day ?? `#${index + 1}`,
        Completed: row.completed ?? row.value ?? row.count ?? 0,
    }));

    const metricTiles = Object.entries(metrics).slice(0, 2);

    return (
        <WidgetFrame
            title="Productivity"
            icon={Activity}
            iconClassName="bg-violet-100/60 text-violet-500 dark:bg-violet-900/30"
            dragHandleProps={dragHandleProps}
        >
            {chartData.length === 0 && metricTiles.length === 0 ? (
                <EmptyState
                    icon={Activity}
                    title="No trends yet"
                    description="Complete a few tasks and your productivity trend will appear here."
                />
            ) : (
                <div className="space-y-4">
                    {metricTiles.length > 0 && (
                        <div className="grid grid-cols-2 gap-3">
                            {metricTiles.map(([key, value]) => (
                                <StatCard
                                    key={key}
                                    label={humanize(key)}
                                    value={value ?? 0}
                                    icon={Activity}
                                    iconClassName="bg-violet-100/60 text-violet-500 dark:bg-violet-900/30"
                                />
                            ))}
                        </div>
                    )}
                    {chartData.length > 0 && (
                        <AreaChart
                            className="h-40"
                            data={chartData}
                            index="label"
                            categories={["Completed"]}
                            colors={["emerald"]}
                            showLegend={false}
                            showGridLines={false}
                            startEndOnly
                            showYAxis={false}
                        />
                    )}
                </div>
            )}
        </WidgetFrame>
    );
}

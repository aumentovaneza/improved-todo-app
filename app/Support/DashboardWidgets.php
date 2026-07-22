<?php

namespace App\Support;

/**
 * Canonical registry of dashboard widgets.
 *
 * This is the single source of truth for which widgets exist, their default
 * size, the sizes they support, and whether they are enabled by default. Both
 * the save-layout validation and the dashboard props are derived from here so
 * that adding a widget only requires editing this list.
 */
class DashboardWidgets
{
    /**
     * The canonical widget definitions, in default display order.
     *
     * @return array<int, array{key: string, title: string, defaultSize: string, allowedSizes: array<int, string>, defaultEnabled: bool}>
     */
    public static function all(): array
    {
        $full = ['sm', 'md', 'lg'];
        $compactWide = ['md', 'lg'];

        return [
            ['key' => 'task_stats', 'title' => 'Task Stats', 'defaultSize' => 'lg', 'allowedSizes' => $compactWide, 'defaultEnabled' => true],
            ['key' => 'today_tasks', 'title' => 'Today', 'defaultSize' => 'md', 'allowedSizes' => $full, 'defaultEnabled' => true],
            ['key' => 'overdue_tasks', 'title' => 'Overdue', 'defaultSize' => 'md', 'allowedSizes' => $full, 'defaultEnabled' => true],
            ['key' => 'upcoming_tasks', 'title' => 'Upcoming', 'defaultSize' => 'md', 'allowedSizes' => $full, 'defaultEnabled' => true],
            ['key' => 'in_progress', 'title' => 'In Progress', 'defaultSize' => 'md', 'allowedSizes' => $full, 'defaultEnabled' => true],
            ['key' => 'upcoming_payments', 'title' => 'Upcoming Payments', 'defaultSize' => 'md', 'allowedSizes' => $full, 'defaultEnabled' => true],
            ['key' => 'budgets', 'title' => 'Budgets', 'defaultSize' => 'md', 'allowedSizes' => $full, 'defaultEnabled' => true],
            ['key' => 'savings_goals', 'title' => 'Savings Goals', 'defaultSize' => 'md', 'allowedSizes' => $full, 'defaultEnabled' => true],
            ['key' => 'calendar', 'title' => 'Calendar', 'defaultSize' => 'md', 'allowedSizes' => $full, 'defaultEnabled' => true],
            ['key' => 'productivity', 'title' => 'Productivity', 'defaultSize' => 'lg', 'allowedSizes' => $full, 'defaultEnabled' => true],
        ];
    }

    /**
     * All valid widget keys.
     *
     * @return array<int, string>
     */
    public static function keys(): array
    {
        return array_column(self::all(), 'key');
    }

    /**
     * The default layout: ordered rows of {key, size, enabled}.
     *
     * @return array<int, array{key: string, size: string, enabled: bool}>
     */
    public static function defaultLayout(): array
    {
        return array_map(fn (array $widget): array => [
            'key' => $widget['key'],
            'size' => $widget['defaultSize'],
            'enabled' => $widget['defaultEnabled'],
        ], self::all());
    }

    /**
     * Look up a single widget definition by key.
     *
     * @return array{key: string, title: string, defaultSize: string, allowedSizes: array<int, string>, defaultEnabled: bool}|null
     */
    public static function find(string $key): ?array
    {
        foreach (self::all() as $widget) {
            if ($widget['key'] === $key) {
                return $widget;
            }
        }

        return null;
    }

    /**
     * The sizes allowed for a given widget key (empty if unknown).
     *
     * @return array<int, string>
     */
    public static function allowedSizesFor(string $key): array
    {
        return self::find($key)['allowedSizes'] ?? [];
    }

    /**
     * The registry metadata exposed to the frontend as `availableWidgets`.
     *
     * @return array<int, array{key: string, title: string, defaultSize: string, allowedSizes: array<int, string>}>
     */
    public static function availableWidgets(): array
    {
        return array_map(fn (array $widget): array => [
            'key' => $widget['key'],
            'title' => $widget['title'],
            'defaultSize' => $widget['defaultSize'],
            'allowedSizes' => $widget['allowedSizes'],
        ], self::all());
    }

    /**
     * Merge a saved layout with the registry so that newly added widgets are
     * appended (with their defaults) and any stale/unknown keys are dropped.
     * Preserves the saved order and per-widget size/enabled choices.
     *
     * @param  array<int, array{key?: string, size?: string, enabled?: bool}>|null  $savedLayout
     * @return array<int, array{key: string, size: string, enabled: bool}>
     */
    public static function normalizeLayout(?array $savedLayout): array
    {
        if (empty($savedLayout)) {
            return self::defaultLayout();
        }

        $validKeys = self::keys();
        $seen = [];
        $normalized = [];

        foreach ($savedLayout as $row) {
            $key = $row['key'] ?? null;

            if (! is_string($key) || ! in_array($key, $validKeys, true) || isset($seen[$key])) {
                continue;
            }

            $definition = self::find($key);
            $size = $row['size'] ?? $definition['defaultSize'];

            if (! in_array($size, $definition['allowedSizes'], true)) {
                $size = $definition['defaultSize'];
            }

            $normalized[] = [
                'key' => $key,
                'size' => $size,
                'enabled' => (bool) ($row['enabled'] ?? $definition['defaultEnabled']),
            ];
            $seen[$key] = true;
        }

        // Append any registry widgets missing from the saved layout so new
        // widgets surface for existing users without wiping their choices.
        foreach (self::defaultLayout() as $defaultRow) {
            if (! isset($seen[$defaultRow['key']])) {
                $normalized[] = $defaultRow;
            }
        }

        return $normalized;
    }
}

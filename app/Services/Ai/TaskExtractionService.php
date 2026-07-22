<?php

namespace App\Services\Ai;

use App\Models\User;
use App\Services\Ai\Contracts\TextGenerator;
use App\Services\Ai\Exceptions\TaskExtractionException;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Turns a natural-language task description ("pay rent every 1st at 9am, high
 * priority") into a structured, validated task payload that pre-fills the task
 * modal. Built on the free-text TextGenerator seam: it prompts for strict JSON
 * and validates the result against the real task schema before returning it —
 * the AI never creates a task directly.
 */
class TaskExtractionService
{
    private const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

    private const RECURRENCE_TYPES = ['daily', 'weekly', 'monthly', 'yearly'];

    private const DEFAULT_TAG_COLOR = '#6B7280';

    public function __construct(
        private TextGenerator $textGenerator,
    ) {}

    /**
     * Extract a normalized task payload from free-text input.
     *
     * @param  iterable<mixed>  $categories  The user's active categories (id + name).
     * @return array<string, mixed> Fields matching the task-create form / store contract.
     *
     * @throws TaskExtractionException When the provider fails or returns unusable output.
     */
    public function extract(User $user, string $input, iterable $categories): array
    {
        $today = $user->nowInUserTimezone();
        $categoryMap = $this->categoryMap($categories);

        $system = $this->systemPrompt();
        $prompt = $this->userPrompt($input, $today, $categoryMap);

        try {
            $raw = $this->textGenerator->generate($system, $prompt);
            $data = $this->decode($raw);
        } catch (TaskExtractionException $e) {
            throw $e;
        } catch (Throwable $e) {
            Log::warning('Task capture extraction failed.', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            throw new TaskExtractionException('The AI could not read that. Try rephrasing, or add the task manually.', 0, $e);
        }

        return $this->normalize($data, $today, $categoryMap);
    }

    private function systemPrompt(): string
    {
        return 'You extract a single structured task from a user\'s natural-language description. '
            .'Respond with ONE minified JSON object and nothing else — no prose, no markdown, no code fences. '
            .'Use exactly these keys: '
            .'"title" (string, required, concise), '
            .'"description" (string or null), '
            .'"priority" (one of "low","medium","high","urgent"; default "medium"), '
            .'"due_date" (YYYY-MM-DD or null), '
            .'"start_time" ("HH:MM" 24-hour or null), '
            .'"end_time" ("HH:MM" 24-hour or null), '
            .'"is_all_day" (boolean), '
            .'"is_recurring" (boolean), '
            .'"recurrence_type" (one of "daily","weekly","monthly","yearly" or null), '
            .'"recurrence_config" (object or null: for weekly use {"days_of_week":[0-6]} where 0=Sunday..6=Saturday; for monthly use {"day_of_month":1-31}; null for daily/yearly), '
            .'"recurring_until" (YYYY-MM-DD or null), '
            .'"category_id" (an id from the provided category list, or null), '
            .'"tags" (array of short tag name strings, or []). '
            .'Resolve relative dates and times against the provided "Today" date. '
            .'If a detail is not mentioned, use null (or a sensible default for priority/is_all_day). '
            .'Only set category_id to an id that appears in the provided list; otherwise use null.';
    }

    /**
     * @param  array<int, string>  $categoryMap
     */
    private function userPrompt(string $input, Carbon $today, array $categoryMap): string
    {
        $lines = [];
        $lines[] = 'Today: '.$today->format('Y-m-d').' ('.$today->format('l').')';

        if ($categoryMap === []) {
            $lines[] = 'Available categories: none';
        } else {
            $lines[] = 'Available categories (id: name):';
            foreach ($categoryMap as $id => $name) {
                $lines[] = "- {$id}: {$name}";
            }
        }

        $lines[] = '';
        $lines[] = 'Task description:';
        $lines[] = trim($input);
        $lines[] = '';
        $lines[] = 'Return the JSON object now.';

        return implode("\n", $lines);
    }

    /**
     * Decode the model's response into an array, tolerating stray code fences
     * or surrounding prose by extracting the first JSON object.
     *
     * @return array<string, mixed>
     */
    private function decode(string $raw): array
    {
        $text = trim($raw);

        if ($text === '') {
            throw new TaskExtractionException('The AI returned an empty response.');
        }

        // Strip a ```json ... ``` fence if the model added one.
        if (str_starts_with($text, '```')) {
            $text = preg_replace('/^```[a-zA-Z]*\s*|\s*```$/', '', $text) ?? $text;
        }

        $decoded = json_decode($text, true);

        if (! is_array($decoded)) {
            // Fall back to the first {...} block anywhere in the text.
            if (preg_match('/\{.*\}/s', $text, $m)) {
                $decoded = json_decode($m[0], true);
            }
        }

        if (! is_array($decoded)) {
            throw new TaskExtractionException('The AI response was not valid JSON.');
        }

        return $decoded;
    }

    /**
     * Validate and coerce the decoded object into the task-create form shape.
     *
     * @param  array<string, mixed>  $data
     * @param  array<int, string>  $categoryMap
     * @return array<string, mixed>
     */
    private function normalize(array $data, Carbon $today, array $categoryMap): array
    {
        $title = trim((string) ($data['title'] ?? ''));

        if ($title === '') {
            throw new TaskExtractionException('The AI could not find a task title. Try rephrasing.');
        }

        $priority = strtolower((string) ($data['priority'] ?? 'medium'));
        if (! in_array($priority, self::PRIORITIES, true)) {
            $priority = 'medium';
        }

        $startTime = $this->normalizeTime($data['start_time'] ?? null);
        $endTime = $this->normalizeTime($data['end_time'] ?? null);

        $isAllDay = array_key_exists('is_all_day', $data)
            ? (bool) $data['is_all_day']
            : ($startTime === null && $endTime === null);

        if ($isAllDay) {
            $startTime = null;
            $endTime = null;
        }

        $isRecurring = (bool) ($data['is_recurring'] ?? false);
        $recurrenceType = null;
        $recurrenceConfig = null;
        $recurringUntil = null;

        if ($isRecurring) {
            $type = strtolower((string) ($data['recurrence_type'] ?? ''));
            $recurrenceType = in_array($type, self::RECURRENCE_TYPES, true) ? $type : null;

            if ($recurrenceType === null) {
                // No usable cadence — treat as a one-off rather than an invalid recurring task.
                $isRecurring = false;
            } else {
                $recurrenceConfig = $this->normalizeRecurrenceConfig($recurrenceType, $data['recurrence_config'] ?? null);
                $recurringUntil = $this->normalizeDate($data['recurring_until'] ?? null)
                    ?? $today->copy()->addYear()->format('Y-m-d');
            }
        }

        return [
            'title' => mb_substr($title, 0, 255),
            'description' => $this->normalizeString($data['description'] ?? null),
            'priority' => $priority,
            'due_date' => $this->normalizeDate($data['due_date'] ?? null),
            'start_time' => $startTime,
            'end_time' => $endTime,
            'is_all_day' => $isAllDay,
            'is_recurring' => $isRecurring,
            'recurrence_type' => $recurrenceType,
            'recurrence_config' => $recurrenceConfig,
            'recurring_until' => $recurringUntil,
            'category_id' => $this->normalizeCategoryId($data['category_id'] ?? null, $categoryMap),
            'tags' => $this->normalizeTags($data['tags'] ?? []),
        ];
    }

    /**
     * @param  array<int, string>  $categoryMap
     */
    private function normalizeCategoryId(mixed $value, array $categoryMap): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        $id = (int) $value;

        return array_key_exists($id, $categoryMap) ? $id : null;
    }

    /**
     * @param  array<int, string>|mixed  $recurrenceConfig
     * @return array<string, mixed>|null
     */
    private function normalizeRecurrenceConfig(string $type, mixed $recurrenceConfig): ?array
    {
        $config = is_array($recurrenceConfig) ? $recurrenceConfig : [];

        if ($type === 'weekly') {
            $days = collect($config['days_of_week'] ?? [])
                ->map(fn ($d) => (int) $d)
                ->filter(fn ($d) => $d >= 0 && $d <= 6)
                ->unique()
                ->values()
                ->all();

            return ['days_of_week' => $days];
        }

        if ($type === 'monthly') {
            $day = (int) ($config['day_of_month'] ?? 0);
            $day = max(1, min(31, $day ?: 1));

            return ['day_of_month' => $day];
        }

        // daily / yearly need no config.
        return null;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function normalizeTags(mixed $tags): array
    {
        if (! is_array($tags)) {
            return [];
        }

        return collect($tags)
            ->map(fn ($tag) => is_array($tag) ? ($tag['name'] ?? null) : $tag)
            ->map(fn ($name) => trim((string) $name))
            ->filter(fn ($name) => $name !== '')
            ->unique()
            ->take(10)
            ->map(fn ($name) => [
                'name' => mb_substr($name, 0, 255),
                'color' => self::DEFAULT_TAG_COLOR,
                'is_new' => true,
            ])
            ->values()
            ->all();
    }

    private function normalizeTime(mixed $value): ?string
    {
        if (! is_string($value) || trim($value) === '') {
            return null;
        }

        return preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', trim($value)) === 1 ? trim($value) : null;
    }

    private function normalizeDate(mixed $value): ?string
    {
        if (empty($value)) {
            return null;
        }

        try {
            return Carbon::parse($value)->format('Y-m-d');
        } catch (Throwable) {
            return null;
        }
    }

    private function normalizeString(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $trimmed = trim($value);

        return $trimmed === '' ? null : $trimmed;
    }

    /**
     * @param  iterable<mixed>  $categories
     * @return array<int, string>
     */
    private function categoryMap(iterable $categories): array
    {
        $map = [];

        foreach ($categories as $category) {
            $id = data_get($category, 'id');
            $name = data_get($category, 'name');

            if ($id !== null && $name !== null) {
                $map[(int) $id] = (string) $name;
            }
        }

        return $map;
    }
}

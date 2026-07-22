<?php

namespace App\Services;

use App\Models\DailySummary;
use App\Models\User;
use App\Repositories\Contracts\DailySummaryRepositoryInterface;
use App\Services\Ai\Contracts\TextGenerator;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Throwable;

class DailySummaryService
{
    public function __construct(
        private DashboardService $dashboardService,
        private DailySummaryRepositoryInterface $repository,
        private TextGenerator $textGenerator,
    ) {}

    /**
     * Whether the user is entitled to the AI daily summary (a "pro" feature).
     *
     * Centralized so gating the feature to a paid plan later is a one-line
     * change. Today it returns true for everyone via the open-beta flag.
     */
    public function userCanUseSummary(User $user): bool
    {
        // Open beta: treat everyone as entitled while we test publicly.
        if (config('ai.daily_summary_open_beta', true)) {
            return true;
        }

        // TODO: gate to pro plan. When a real paid tier/subscription exists,
        // replace this with the entitlement check (mirroring the tier pattern
        // in App\Modules\Finance\Services\FinanceAccessService::getTier()), e.g.
        // return $user->hasProPlan();
        return false;
    }

    /**
     * Generate (and persist) the daily summary for a user. Falls back to a
     * deterministic template if the AI provider fails, so the dashboard never
     * breaks on provider errors.
     */
    public function generateForUser(User $user, ?Carbon $date = null): DailySummary
    {
        $date = $date ? $date->copy() : $user->nowInUserTimezone();

        $context = $this->dashboardService->buildDaySummaryContext($user);
        $provider = (string) config('ai.default', 'anthropic');
        $model = (string) config("ai.providers.{$provider}.model", $provider);

        $system = 'You are a thoughtful personal productivity assistant writing a user\'s daily briefing. '
            .'Write a warm, in-depth summary of about 3 short paragraphs (roughly 6-10 sentences). '
            .'Reference the user\'s actual tasks, deadlines, payments, and calendar events by name when they are provided. '
            .'Clearly flag anything overdue and suggest what to prioritise first, note upcoming commitments and payments so nothing slips, '
            .'and close with a short, genuine note of encouragement. '
            .'Address the user directly by their first name. Write in plain prose only — no markdown, no headings, no bullet lists.';
        $prompt = $this->buildPrompt($user, $date, $context);

        try {
            $content = trim($this->textGenerator->generate($system, $prompt));

            if ($content === '') {
                throw new \RuntimeException('AI provider returned an empty summary.');
            }
        } catch (Throwable $e) {
            Log::warning('Daily summary generation failed; using template fallback.', [
                'user_id' => $user->id,
                'provider' => $provider,
                'error' => $e->getMessage(),
            ]);

            $content = $this->templateSummary($context);
            $provider = 'fallback';
            $model = 'template';
        }

        return $this->repository->upsertForUserOnDate($user->id, $date, [
            'content' => $content,
            'provider' => $provider,
            'model' => $model,
            'generated_at' => now(),
        ]);
    }

    /**
     * The cached summary for the user's current local day, if one exists.
     */
    public function getCachedForToday(User $user): ?DailySummary
    {
        return $this->repository->findForUserOnDate($user->id, $user->nowInUserTimezone());
    }

    /**
     * Build the user prompt from the gathered day context. Includes concrete
     * task/payment/calendar detail (not just counts) so the model can write a
     * specific, in-depth briefing.
     *
     * @param  array<string, mixed>  $context
     */
    private function buildPrompt(User $user, Carbon $date, array $context): string
    {
        $firstName = trim(explode(' ', trim((string) $user->name))[0] ?? (string) $user->name);

        $lines = [];
        $lines[] = "User's first name: {$firstName}";
        $lines[] = 'Local date: '.$date->format('l, F j, Y');
        $lines[] = '';

        $lines = array_merge($lines, $this->taskSection('OVERDUE TASKS', $context['overdue_tasks'] ?? []));
        $lines = array_merge($lines, $this->taskSection('DUE TODAY', $context['today_tasks'] ?? []));
        $lines = array_merge($lines, $this->taskSection('UPCOMING TASKS (next 7 days)', $context['upcoming_tasks'] ?? []));
        $lines = array_merge($lines, $this->paymentSection($context['payments'] ?? []));
        $lines = array_merge($lines, $this->calendarSection($context['calendar'] ?? []));

        $lines[] = '';
        $lines[] = 'Write the daily briefing now.';

        return implode("\n", $lines);
    }

    /**
     * Render a titled list of tasks (title, due date, priority) for the prompt.
     *
     * @param  iterable<mixed>  $tasks
     * @return array<int, string>
     */
    private function taskSection(string $heading, iterable $tasks): array
    {
        $rows = collect($tasks)->take(8)->map(function ($task) {
            $title = (string) ($task->title ?? 'Untitled task');
            $due = $this->formatDate($task->due_date ?? null);
            $priority = $task->priority ?? null;

            $meta = array_filter([
                $due ? "due {$due}" : null,
                $priority ? "{$priority} priority" : null,
            ]);

            return '- '.$title.($meta ? ' ('.implode(', ', $meta).')' : '');
        })->all();

        if (empty($rows)) {
            return ["{$heading}: none", ''];
        }

        return array_merge(["{$heading}:"], $rows, ['']);
    }

    /**
     * Render upcoming payments (name, amount, date) for the prompt.
     *
     * @param  iterable<mixed>  $payments
     * @return array<int, string>
     */
    private function paymentSection(iterable $payments): array
    {
        $rows = collect($payments)->take(8)->map(function ($payment) {
            $name = (string) ($payment->description ?? $payment->category->name ?? $payment->loan->name ?? 'Payment');
            $currency = $payment->currency ?? '';
            $amount = $payment->amount !== null ? trim($currency.' '.number_format((float) $payment->amount, 2)) : null;
            $when = $this->formatDate($payment->occurred_at ?? null);

            $meta = array_filter([$amount, $when ? "on {$when}" : null]);

            return '- '.$name.($meta ? ' ('.implode(', ', $meta).')' : '');
        })->all();

        if (empty($rows)) {
            return ['UPCOMING PAYMENTS (next 30 days): none', ''];
        }

        return array_merge(['UPCOMING PAYMENTS (next 30 days):'], $rows, ['']);
    }

    /**
     * Render calendar items ({date, title, type}) for the prompt.
     *
     * @param  iterable<mixed>  $items
     * @return array<int, string>
     */
    private function calendarSection(iterable $items): array
    {
        $rows = collect($items)->take(10)->map(function ($item) {
            $title = (string) ($item['title'] ?? 'Event');
            $type = $item['type'] ?? null;
            $when = $this->formatDate($item['date'] ?? null);

            $meta = array_filter([$type, $when ? "on {$when}" : null]);

            return '- '.$title.($meta ? ' ('.implode(', ', $meta).')' : '');
        })->all();

        if (empty($rows)) {
            return ['CALENDAR (next 7 days): none', ''];
        }

        return array_merge(['CALENDAR (next 7 days):'], $rows, ['']);
    }

    /**
     * Format a date-ish value (Carbon or parseable string) as "Mon, Jun 3".
     */
    private function formatDate(mixed $value): ?string
    {
        if (empty($value)) {
            return null;
        }

        try {
            return Carbon::parse($value)->format('D, M j');
        } catch (Throwable) {
            return null;
        }
    }

    /**
     * Deterministic fallback summary used when the AI provider is unavailable.
     *
     * @param  array<string, mixed>  $context
     */
    private function templateSummary(array $context): string
    {
        $counts = $this->counts($context);

        return sprintf(
            'You have %d task%s due today, %d overdue, and %d upcoming this week. There %s %d payment%s scheduled in the next 30 days. Have a productive day!',
            $counts['today'],
            $counts['today'] === 1 ? '' : 's',
            $counts['overdue'],
            $counts['upcoming'],
            $counts['payments'] === 1 ? 'is' : 'are',
            $counts['payments'],
            $counts['payments'] === 1 ? '' : 's',
        );
    }

    /**
     * @param  array<string, mixed>  $context
     * @return array{today: int, overdue: int, upcoming: int, payments: int, calendar: int}
     */
    private function counts(array $context): array
    {
        return [
            'today' => $this->count($context['today_tasks'] ?? []),
            'overdue' => $this->count($context['overdue_tasks'] ?? []),
            'upcoming' => $this->count($context['upcoming_tasks'] ?? []),
            'payments' => $this->count($context['payments'] ?? []),
            'calendar' => $this->count($context['calendar'] ?? []),
        ];
    }

    private function count(mixed $value): int
    {
        return is_countable($value) ? count($value) : 0;
    }
}

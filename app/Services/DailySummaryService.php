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

        $system = 'You are a concise daily planner assistant. Write a friendly 2-4 sentence summary of the user\'s day.';
        $prompt = $this->buildPrompt($user, $context);

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
     * Build the user prompt from the gathered day context.
     *
     * @param  array<string, mixed>  $context
     */
    private function buildPrompt(User $user, array $context): string
    {
        $counts = $this->counts($context);

        $lines = [];
        $lines[] = "User: {$user->name}";
        $lines[] = "Tasks due today: {$counts['today']}";
        $lines[] = "Overdue tasks: {$counts['overdue']}";
        $lines[] = "Upcoming tasks (next 7 days): {$counts['upcoming']}";
        $lines[] = "Upcoming payments (next 30 days): {$counts['payments']}";
        $lines[] = "Calendar items (next 7 days): {$counts['calendar']}";

        $todayTitles = collect($context['today_tasks'] ?? [])
            ->take(5)
            ->map(fn ($task) => '- '.(string) ($task->title ?? 'Untitled'))
            ->all();

        if (! empty($todayTitles)) {
            $lines[] = "Today's task titles:";
            $lines = array_merge($lines, $todayTitles);
        }

        $lines[] = '';
        $lines[] = 'Summarize the day for the user in 2-4 encouraging sentences.';

        return implode("\n", $lines);
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

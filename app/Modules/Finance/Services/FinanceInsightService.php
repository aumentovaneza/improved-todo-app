<?php

namespace App\Modules\Finance\Services;

use App\Models\User;
use App\Modules\Finance\Models\FinanceInsight;
use App\Modules\Finance\Repositories\FinanceInsightRepository;
use App\Modules\Finance\Repositories\FinanceSavingsGoalRepository;
use App\Services\Ai\Contracts\TextGenerator;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Throwable;

class FinanceInsightService
{
    public function __construct(
        private FinanceReportService $reportService,
        private FinanceSavingsGoalRepository $savingsGoalRepository,
        private FinanceInsightRepository $repository,
        private FinanceAccessService $accessService,
        private TextGenerator $textGenerator,
    ) {}

    /**
     * Whether the user is entitled to AI spending insights (a "pro" feature).
     *
     * Centralized so gating the feature to a paid plan later is a one-line
     * change. During the open beta everyone is entitled; once the beta ends the
     * real tier check in FinanceAccessService takes over.
     */
    public function userCanUseInsights(User $user): bool
    {
        // Open beta: treat everyone as entitled while we test publicly.
        if (config('ai.finance_insights_open_beta', true)) {
            return true;
        }

        return $this->accessService->canUseInsights($user);
    }

    /**
     * Generate (and persist) the spending-insight coach for a user and range.
     * Falls back to a deterministic template if the AI provider fails, so the
     * dashboard never breaks on provider errors.
     */
    public function generateForUser(User $user, ?string $range = null): FinanceInsight
    {
        $context = $this->buildContext($user, $range);
        [$periodStart, $periodEnd] = $this->resolvePeriod($context);

        $provider = (string) config('ai.default', 'anthropic');
        $model = (string) config("ai.providers.{$provider}.model", $provider);

        $system = 'You are a warm, practical personal finance coach writing a user\'s spending briefing. '
            .'Write about 2-3 short paragraphs (roughly 5-8 sentences) in plain prose. '
            .'Reference the user\'s actual numbers and category names when they are provided. '
            .'Highlight where the money went, flag categories or budgets that look overspent, note progress toward savings goals, '
            .'and give one or two concrete, actionable suggestions for the rest of the period. '
            .'Address the user directly by their first name and close with a short, genuine note of encouragement. '
            .'Write in plain prose only — no markdown, no headings, no bullet lists.';
        $prompt = $this->buildPrompt($user, $context);

        try {
            $content = trim($this->textGenerator->generate($system, $prompt));

            if ($content === '') {
                throw new \RuntimeException('AI provider returned an empty insight.');
            }
        } catch (Throwable $e) {
            Log::warning('Finance insight generation failed; using template fallback.', [
                'user_id' => $user->id,
                'provider' => $provider,
                'error' => $e->getMessage(),
            ]);

            $content = $this->templateInsight($context);
            $provider = 'fallback';
            $model = 'template';
        }

        return $this->repository->upsertForUserAndPeriod(
            $user->id,
            $periodStart,
            $periodEnd,
            (string) ($context['summary']['range'] ?? 'this_month'),
            [
                'content' => $content,
                'provider' => $provider,
                'model' => $model,
                'generated_at' => now(),
            ]
        );
    }

    /**
     * The cached insight for the user's currently-selected period, if one
     * exists. Used on dashboard load so we never regenerate on every visit.
     */
    public function getCachedForCurrentPeriod(User $user, ?string $range = null): ?FinanceInsight
    {
        $context = $this->buildContext($user, $range);
        [$periodStart, $periodEnd] = $this->resolvePeriod($context);

        return $this->repository->findForUserAndPeriod($user->id, $periodStart, $periodEnd);
    }

    /**
     * Gather the finance context for the prompt by reusing the report layer —
     * totals, category breakdown, and budgets — plus savings-goal progress.
     * No new SQL: buildDashboardData already computes everything portably.
     *
     * @return array<string, mixed>
     */
    private function buildContext(User $user, ?string $range): array
    {
        $report = $this->reportService->buildDashboardData($user->id, $range);
        $goals = $this->savingsGoalRepository->getForUser($user->id);

        return [
            'summary' => $report['summary'] ?? [],
            'category_breakdown' => $report['charts']['category_breakdown'] ?? [],
            'budgets' => $report['budgets'] ?? [],
            'savings_goals' => $goals,
        ];
    }

    /**
     * Resolve the [start, end] Carbon boundaries the insight is keyed on from
     * the report summary's period.
     *
     * @param  array<string, mixed>  $context
     * @return array{0: Carbon, 1: Carbon}
     */
    private function resolvePeriod(array $context): array
    {
        $period = $context['summary']['period'] ?? [];

        $start = ! empty($period['start']) ? Carbon::parse($period['start']) : now()->startOfMonth();
        $end = ! empty($period['end']) ? Carbon::parse($period['end']) : now()->endOfMonth();

        return [$start, $end];
    }

    /**
     * Build the user prompt from the gathered finance context.
     *
     * @param  array<string, mixed>  $context
     */
    private function buildPrompt(User $user, array $context): string
    {
        $firstName = trim(explode(' ', trim((string) $user->name))[0] ?? (string) $user->name);
        $summary = $context['summary'];

        $lines = [];
        $lines[] = "User's first name: {$firstName}";
        $lines[] = 'Period: '.$this->periodLabel($summary);
        $lines[] = '';

        $lines[] = 'TOTALS:';
        $lines[] = '- Income: '.$this->money($summary['income'] ?? 0);
        $lines[] = '- Expenses: '.$this->money($summary['expenses'] ?? 0);
        $lines[] = '- Savings: '.$this->money($summary['savings'] ?? 0);
        $lines[] = '- Net (income + loans - expenses): '.$this->money($summary['net'] ?? 0);
        if (isset($summary['budget_utilization'])) {
            $lines[] = '- Budget utilization: '.number_format((float) $summary['budget_utilization'], 1).'% of budgeted amounts spent';
        }
        $lines[] = '';

        $lines = array_merge($lines, $this->categorySection($context['category_breakdown'] ?? []));
        $lines = array_merge($lines, $this->budgetSection($context['budgets'] ?? []));
        $lines = array_merge($lines, $this->savingsGoalSection($context['savings_goals'] ?? []));

        $lines[] = 'Write the spending briefing now.';

        return implode("\n", $lines);
    }

    /**
     * Render the top spending/savings categories for the prompt.
     *
     * @param  iterable<mixed>  $categories
     * @return array<int, string>
     */
    private function categorySection(iterable $categories): array
    {
        $rows = collect($categories)
            ->sortByDesc(fn ($row) => (float) ($row['total'] ?? 0))
            ->take(8)
            ->map(function ($row) {
                $label = (string) ($row['label'] ?? $row['name'] ?? 'Uncategorized');

                return '- '.$label.': '.$this->money($row['total'] ?? 0);
            })
            ->all();

        if (empty($rows)) {
            return ['TOP CATEGORIES: none', ''];
        }

        return array_merge(['TOP CATEGORIES (by amount):'], $rows, ['']);
    }

    /**
     * Render active budgets (name, amount) for the prompt.
     *
     * @param  iterable<mixed>  $budgets
     * @return array<int, string>
     */
    private function budgetSection(iterable $budgets): array
    {
        $rows = collect($budgets)->take(10)->map(function ($budget) {
            $name = (string) (data_get($budget, 'name') ?? 'Budget');
            $amount = data_get($budget, 'amount');
            $spent = data_get($budget, 'current_spent');

            $meta = array_filter([
                $amount !== null ? 'limit '.$this->money($amount) : null,
                $spent !== null ? 'spent '.$this->money($spent) : null,
            ]);

            return '- '.$name.($meta ? ' ('.implode(', ', $meta).')' : '');
        })->all();

        if (empty($rows)) {
            return ['BUDGETS: none', ''];
        }

        return array_merge(['BUDGETS:'], $rows, ['']);
    }

    /**
     * Render savings goals (name, progress) for the prompt.
     *
     * @param  iterable<mixed>  $goals
     * @return array<int, string>
     */
    private function savingsGoalSection(iterable $goals): array
    {
        $rows = collect($goals)->take(8)->map(function ($goal) {
            $name = (string) (data_get($goal, 'name') ?? 'Savings goal');
            $current = (float) (data_get($goal, 'current_amount') ?? 0);
            $target = (float) (data_get($goal, 'target_amount') ?? 0);

            $progress = $target > 0
                ? ' ('.$this->money($current).' of '.$this->money($target).', '.round(($current / $target) * 100).'%)'
                : ' ('.$this->money($current).' saved)';

            return '- '.$name.$progress;
        })->all();

        if (empty($rows)) {
            return ['SAVINGS GOALS: none', ''];
        }

        return array_merge(['SAVINGS GOALS:'], $rows, ['']);
    }

    /**
     * Deterministic fallback insight used when the AI provider is unavailable.
     *
     * @param  array<string, mixed>  $context
     */
    private function templateInsight(array $context): string
    {
        $summary = $context['summary'];

        return sprintf(
            'This period you brought in %s and spent %s, setting aside %s in savings for a net of %s. '
            .'Keep an eye on your largest spending categories and your budgets, and keep chipping away at your savings goals. '
            .'You are staying on top of it — nice work.',
            $this->money($summary['income'] ?? 0),
            $this->money($summary['expenses'] ?? 0),
            $this->money($summary['savings'] ?? 0),
            $this->money($summary['net'] ?? 0),
        );
    }

    /**
     * @param  array<string, mixed>  $summary
     */
    private function periodLabel(array $summary): string
    {
        $period = $summary['period'] ?? [];

        try {
            $start = ! empty($period['start']) ? Carbon::parse($period['start'])->format('M j, Y') : '?';
            $end = ! empty($period['end']) ? Carbon::parse($period['end'])->format('M j, Y') : '?';

            return "{$start} – {$end}";
        } catch (Throwable) {
            return (string) ($summary['range'] ?? 'this month');
        }
    }

    private function money(mixed $value): string
    {
        return number_format((float) $value, 2);
    }
}

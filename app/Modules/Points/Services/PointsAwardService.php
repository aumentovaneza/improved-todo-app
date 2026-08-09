<?php

namespace App\Modules\Points\Services;

use App\Models\Subtask;
use App\Models\Task;
use App\Models\User;
use App\Modules\Points\Enums\PointSource;
use App\Modules\Points\Models\PointLedgerEntry;
use App\Modules\Points\Models\PointWallet;
use App\Modules\Points\Models\PomodoroSession;
use App\Modules\Points\Repositories\Contracts\PointLedgerRepositoryInterface;
use Illuminate\Database\Eloquent\Model;

/**
 * Translates productive actions into point awards / reversals.
 *
 * Award idempotency uses a net-award guard: award only when the running net
 * (SUM of signed ledger amounts) for a source + sourceable is <= 0. Reversals
 * subtract the outstanding net but are clamped by the wallet so the balance
 * never drops below 0. Every earn also rolls the daily streak.
 */
class PointsAwardService
{
    public function __construct(
        private PointsWalletService $walletService,
        private PointLedgerRepositoryInterface $ledger,
    ) {}

    public function awardForTask(Task $task): void
    {
        $this->awardFor($task, $task->user, PointSource::TaskCompletion, (int) config('points.award.task_completion'));
    }

    public function reverseForTask(Task $task): void
    {
        $this->reverseFor($task, $task->user_id, PointSource::TaskCompletion);
    }

    public function awardForSubtask(Subtask $subtask): void
    {
        $task = $subtask->task;

        if (! $task) {
            return;
        }

        $this->awardFor($subtask, $task->user, PointSource::SubtaskCompletion, (int) config('points.award.subtask_completion'));
    }

    public function reverseForSubtask(Subtask $subtask): void
    {
        $task = $subtask->task;

        if (! $task) {
            return;
        }

        $this->reverseFor($subtask, $task->user_id, PointSource::SubtaskCompletion);
    }

    /**
     * Credit a completed, awardable Pomodoro session and roll the streak.
     */
    public function awardForPomodoro(PomodoroSession $session): PointLedgerEntry
    {
        $user = $session->user;
        $amount = (int) config('points.award.pomodoro_session');

        $entry = $this->walletService->credit(
            $user->id,
            $amount,
            PointSource::PomodoroSession,
            $session,
        );

        $this->registerStreakActivity($this->walletService->ensureWallet($user->id), $user);

        return $entry;
    }

    /**
     * Roll the user's daily streak and award the once-per-day streak bonus.
     */
    public function registerStreakActivity(PointWallet $wallet, User $user): void
    {
        $wallet->refresh();

        $today = $user->todayInUserTimezone()->toDateString();
        $yesterday = $user->todayInUserTimezone()->subDay()->toDateString();
        $lastEarned = $wallet->last_earned_on?->toDateString();

        if ($lastEarned === $today) {
            // Already active today; keep the streak but ensure it is at least 1.
            $wallet->current_streak_days = max(1, $wallet->current_streak_days);
        } elseif ($lastEarned === $yesterday) {
            $wallet->current_streak_days = $wallet->current_streak_days + 1;
        } else {
            $wallet->current_streak_days = 1;
        }

        $wallet->longest_streak_days = max($wallet->longest_streak_days, $wallet->current_streak_days);
        $wallet->last_earned_on = $today;
        $wallet->save();

        if ($wallet->last_streak_awarded_on?->toDateString() === $today) {
            return;
        }

        $this->walletService->credit(
            $user->id,
            (int) config('points.award.daily_streak'),
            PointSource::DailyStreak,
            null,
            "streak:{$user->id}:{$today}",
        );

        $wallet->last_streak_awarded_on = $today;
        $wallet->save();
    }

    private function awardFor(Model $sourceable, ?User $user, PointSource $source, int $amount): void
    {
        if (! $user) {
            return;
        }

        // Net-award guard: only award when nothing net-positive is outstanding.
        if ($this->ledger->netAwardedFor($user->id, $source, $sourceable) > 0) {
            return;
        }

        $this->walletService->credit($user->id, $amount, $source, $sourceable);

        $this->registerStreakActivity($this->walletService->ensureWallet($user->id), $user);
    }

    private function reverseFor(Model $sourceable, ?int $userId, PointSource $source): void
    {
        if (! $userId) {
            return;
        }

        $net = $this->ledger->netAwardedFor($userId, $source, $sourceable);

        if ($net <= 0) {
            return;
        }

        $this->walletService->adjust($userId, $net, $source, $sourceable);
    }
}

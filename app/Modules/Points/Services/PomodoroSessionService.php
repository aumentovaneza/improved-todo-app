<?php

namespace App\Modules\Points\Services;

use App\Models\User;
use App\Modules\Points\Models\PomodoroSession;
use App\Modules\Points\Repositories\Contracts\PomodoroSessionRepositoryInterface;
use Carbon\Carbon;

/**
 * Persists client-driven Pomodoro sessions with server-authoritative award
 * rules. Amounts and validity windows come from config only; client-supplied
 * point values are ignored.
 */
class PomodoroSessionService
{
    public function __construct(
        private PomodoroSessionRepositoryInterface $sessions,
        private PointsAwardService $awardService,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function record(User $user, array $data): PomodoroSession
    {
        $clientRequestId = $data['client_request_id'] ?? null;

        if ($clientRequestId !== null && ($existing = $this->sessions->findByClientRequestId($user->id, $clientRequestId))) {
            return $existing;
        }

        $type = (string) $data['type'];
        $duration = (int) $data['duration_seconds'];
        $completedAt = ! empty($data['completed_at']) ? Carbon::parse($data['completed_at']) : now();
        $startedAt = ! empty($data['started_at']) ? Carbon::parse($data['started_at']) : null;

        $awardable = $this->isAwardable($user, $type, $duration);

        $session = $this->sessions->create([
            'user_id' => $user->id,
            'client_request_id' => $clientRequestId,
            'type' => $type,
            'duration_seconds' => $duration,
            'started_at' => $startedAt,
            'completed_at' => $completedAt,
            'awarded_points' => 0,
        ]);

        if ($awardable) {
            $entry = $this->awardService->awardForPomodoro($session);

            $session->awarded_points = (int) config('points.award.pomodoro_session');
            $session->point_ledger_entry_id = $entry->id;
            $session->save();
        }

        return $session;
    }

    private function isAwardable(User $user, string $type, int $duration): bool
    {
        $awardableTypes = (array) config('points.pomodoro.awardable_types', []);

        if (! in_array($type, $awardableTypes, true)) {
            return false;
        }

        $min = (int) config('points.pomodoro.min_seconds');
        $max = (int) config('points.pomodoro.max_seconds');

        if ($duration < $min || $duration > $max) {
            return false;
        }

        // Stored timestamps are UTC — convert the user's local day boundaries.
        $start = $user->todayInUserTimezone()->utc();
        $end = $start->copy()->addDay();
        $cap = (int) config('points.pomodoro.daily_award_cap');

        return $this->sessions->todaysAwardedCount($user->id, $start, $end) < $cap;
    }
}

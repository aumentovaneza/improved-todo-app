<?php

namespace App\Modules\Points\Repositories\Eloquent;

use App\Modules\Points\Models\PomodoroSession;
use App\Modules\Points\Repositories\Contracts\PomodoroSessionRepositoryInterface;
use Carbon\CarbonInterface;

class PomodoroSessionRepository implements PomodoroSessionRepositoryInterface
{
    public function create(array $data): PomodoroSession
    {
        return PomodoroSession::create($data);
    }

    public function existsByClientRequestId(int $userId, string $clientRequestId): bool
    {
        return PomodoroSession::query()
            ->where('user_id', $userId)
            ->where('client_request_id', $clientRequestId)
            ->exists();
    }

    public function findByClientRequestId(int $userId, string $clientRequestId): ?PomodoroSession
    {
        return PomodoroSession::query()
            ->where('user_id', $userId)
            ->where('client_request_id', $clientRequestId)
            ->first();
    }

    public function todaysAwardedCount(int $userId, CarbonInterface $start, CarbonInterface $end): int
    {
        // Count against server-set created_at, never the client-supplied
        // completed_at — otherwise backdated sessions escape the daily cap.
        return PomodoroSession::query()
            ->where('user_id', $userId)
            ->where('awarded_points', '>', 0)
            ->whereBetween('created_at', [$start, $end])
            ->count();
    }
}

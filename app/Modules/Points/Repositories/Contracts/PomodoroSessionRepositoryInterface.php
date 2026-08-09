<?php

namespace App\Modules\Points\Repositories\Contracts;

use App\Modules\Points\Models\PomodoroSession;
use Carbon\CarbonInterface;

interface PomodoroSessionRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): PomodoroSession;

    public function existsByClientRequestId(int $userId, string $clientRequestId): bool;

    public function findByClientRequestId(int $userId, string $clientRequestId): ?PomodoroSession;

    /**
     * Count of sessions that already earned points within the given window.
     */
    public function todaysAwardedCount(int $userId, CarbonInterface $start, CarbonInterface $end): int;
}

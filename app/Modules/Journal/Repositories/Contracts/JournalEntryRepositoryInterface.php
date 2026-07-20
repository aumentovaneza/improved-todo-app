<?php

namespace App\Modules\Journal\Repositories\Contracts;

use App\Modules\Journal\Models\JournalEntry;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface JournalEntryRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $filters
     */
    public function paginateForUser(int $userId, array $filters, int $perPage = 15): LengthAwarePaginator;

    public function findForUser(int $id, int $userId): ?JournalEntry;

    /**
     * Every entry for a user in chronological order, optionally bounded by an
     * entry_date range. Intended for exports (not limit-capped or paginated).
     *
     * @return Collection<int, JournalEntry>
     */
    public function getForUserInRange(int $userId, ?Carbon $startDate, ?Carbon $endDate): Collection;

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): JournalEntry;

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(JournalEntry $entry, array $data): JournalEntry;

    public function delete(JournalEntry $entry): bool;
}

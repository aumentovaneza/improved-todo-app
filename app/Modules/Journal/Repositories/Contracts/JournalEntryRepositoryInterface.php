<?php

namespace App\Modules\Journal\Repositories\Contracts;

use App\Modules\Journal\Models\JournalEntry;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface JournalEntryRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $filters
     */
    public function paginateForUser(int $userId, array $filters, int $perPage = 15): LengthAwarePaginator;

    public function findForUser(int $id, int $userId): ?JournalEntry;

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

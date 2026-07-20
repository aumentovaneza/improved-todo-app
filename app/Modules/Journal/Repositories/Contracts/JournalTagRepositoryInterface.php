<?php

namespace App\Modules\Journal\Repositories\Contracts;

use App\Modules\Journal\Models\JournalEntry;
use Illuminate\Database\Eloquent\Collection;

interface JournalTagRepositoryInterface
{
    public function allForUser(int $userId): Collection;

    /**
     * @param  array<int, string>  $names
     */
    public function syncByNames(JournalEntry $entry, array $names, int $userId): void;
}

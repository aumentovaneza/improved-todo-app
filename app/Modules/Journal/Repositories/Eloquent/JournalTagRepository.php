<?php

namespace App\Modules\Journal\Repositories\Eloquent;

use App\Modules\Journal\Models\JournalEntry;
use App\Modules\Journal\Models\JournalTag;
use App\Modules\Journal\Repositories\Contracts\JournalTagRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class JournalTagRepository implements JournalTagRepositoryInterface
{
    public function allForUser(int $userId): Collection
    {
        return JournalTag::query()
            ->where('user_id', $userId)
            ->orderBy('name')
            ->get();
    }

    public function syncByNames(JournalEntry $entry, array $names, int $userId): void
    {
        $ids = [];

        foreach ($names as $name) {
            $name = trim((string) $name);

            if ($name === '') {
                continue;
            }

            $tag = JournalTag::firstOrCreate(
                ['user_id' => $userId, 'name' => $name],
            );

            $ids[] = $tag->id;
        }

        $entry->tags()->sync(array_unique($ids));
    }
}

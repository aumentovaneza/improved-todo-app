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
        // name is encrypted, so ORDER BY runs in PHP against the decrypted value.
        return JournalTag::query()
            ->where('user_id', $userId)
            ->get()
            ->sortBy(fn (JournalTag $tag) => mb_strtolower(trim((string) $tag->name)))
            ->values();
    }

    public function syncByNames(JournalEntry $entry, array $names, int $userId): void
    {
        // name is encrypted (non-deterministic ciphertext), so a SQL
        // firstOrCreate on it would never match and would create a duplicate
        // tag on every save. Resolve existing tags in PHP against decrypted
        // names (case-insensitive, mirroring the old unique constraint).
        $existing = JournalTag::query()
            ->where('user_id', $userId)
            ->get()
            ->keyBy(fn (JournalTag $tag) => mb_strtolower(trim((string) $tag->name)));

        $ids = [];

        foreach ($names as $name) {
            $name = trim((string) $name);

            if ($name === '') {
                continue;
            }

            $key = mb_strtolower($name);
            $tag = $existing->get($key);

            if (! $tag) {
                $tag = JournalTag::create(['user_id' => $userId, 'name' => $name]);
                $existing->put($key, $tag);
            }

            $ids[] = $tag->id;
        }

        $entry->tags()->sync(array_unique($ids));
    }
}

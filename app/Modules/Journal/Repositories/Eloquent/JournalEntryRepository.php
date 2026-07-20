<?php

namespace App\Modules\Journal\Repositories\Eloquent;

use App\Modules\Journal\Models\JournalEntry;
use App\Modules\Journal\Repositories\Contracts\JournalEntryRepositoryInterface;
use App\Support\EncryptedSearch;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class JournalEntryRepository implements JournalEntryRepositoryInterface
{
    public function paginateForUser(int $userId, array $filters, int $perPage = 15): LengthAwarePaginator
    {
        $query = JournalEntry::query()
            ->where('user_id', $userId)
            ->with('tags');

        // mood / tag / date filters stay in SQL (all plaintext columns).
        if (! empty($filters['mood'])) {
            $query->where('mood', $filters['mood']);
        }

        if (! empty($filters['tag_id'])) {
            $query->whereHas('tags', function ($tagQuery) use ($filters) {
                $tagQuery->where('journal_tags.id', $filters['tag_id']);
            });
        }

        if (! empty($filters['date'])) {
            $query->whereDate('entry_date', $filters['date']);
        }

        $query->orderByDesc('entry_date')->orderByDesc('id');

        // title is encrypted, so the search term is matched in PHP against the
        // decrypted value, then paginated preserving the prop shape.
        if (! empty($filters['search'])) {
            $search = (string) $filters['search'];

            $matched = $query->get()->filter(
                fn (JournalEntry $entry) => EncryptedSearch::matches($entry->title, $search)
            )->values();

            return EncryptedSearch::paginate($matched, $perPage);
        }

        return $query->paginate($perPage)->withQueryString();
    }

    public function findForUser(int $id, int $userId): ?JournalEntry
    {
        return JournalEntry::query()
            ->where('user_id', $userId)
            ->with('tags')
            ->find($id);
    }

    public function getForUserInRange(int $userId, ?Carbon $startDate, ?Carbon $endDate): Collection
    {
        return JournalEntry::query()
            ->where('user_id', $userId)
            ->with('tags')
            ->when($startDate, fn ($query) => $query->whereDate('entry_date', '>=', $startDate->toDateString()))
            ->when($endDate, fn ($query) => $query->whereDate('entry_date', '<=', $endDate->toDateString()))
            ->orderBy('entry_date')
            ->orderBy('id')
            ->get();
    }

    public function create(array $data): JournalEntry
    {
        return JournalEntry::create($data);
    }

    public function update(JournalEntry $entry, array $data): JournalEntry
    {
        $entry->update($data);

        return $entry;
    }

    public function delete(JournalEntry $entry): bool
    {
        return (bool) $entry->delete();
    }
}

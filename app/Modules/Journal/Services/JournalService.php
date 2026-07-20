<?php

namespace App\Modules\Journal\Services;

use App\Modules\Journal\Models\JournalEntry;
use App\Modules\Journal\Repositories\Contracts\JournalEntryRepositoryInterface;
use App\Modules\Journal\Repositories\Contracts\JournalTagRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;

class JournalService
{
    public function __construct(
        private JournalEntryRepositoryInterface $entryRepository,
        private JournalTagRepositoryInterface $tagRepository,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, int $userId): JournalEntry
    {
        return DB::transaction(function () use ($data, $userId) {
            $data['user_id'] = $userId;
            $data['excerpt'] = $this->deriveExcerpt($data['content'] ?? []);

            $tags = $data['tags'] ?? null;
            unset($data['tags']);

            $entry = $this->entryRepository->create($data);
            $this->syncTags($entry, $tags, $userId);

            return $entry->load('tags');
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(JournalEntry $entry, array $data, int $userId): JournalEntry
    {
        $this->ensureOwnership($entry, $userId);

        return DB::transaction(function () use ($entry, $data, $userId) {
            $data['user_id'] = $userId;

            if (array_key_exists('content', $data)) {
                $data['excerpt'] = $this->deriveExcerpt($data['content'] ?? []);
            }

            $tags = $data['tags'] ?? null;
            unset($data['tags']);

            $entry = $this->entryRepository->update($entry, $data);
            $this->syncTags($entry, $tags, $userId);

            return $entry->load('tags');
        });
    }

    public function delete(JournalEntry $entry, int $userId): void
    {
        $this->ensureOwnership($entry, $userId);

        DB::transaction(function () use ($entry) {
            $this->entryRepository->delete($entry);
        });
    }

    /**
     * @param  array<int, string>|null  $tags
     */
    private function syncTags(JournalEntry $entry, ?array $tags, int $userId): void
    {
        if ($tags === null) {
            return;
        }

        $this->tagRepository->syncByNames($entry, $tags, $userId);
    }

    private function ensureOwnership(JournalEntry $entry, int $userId): void
    {
        if ((int) $entry->user_id !== $userId) {
            throw new UnauthorizedHttpException('', 'You do not have permission to modify this journal entry.');
        }
    }

    /**
     * Walk a TipTap JSON document collecting plain text from every text node
     * and return a trimmed, length-limited preview.
     *
     * @param  array<string, mixed>  $content
     */
    private function deriveExcerpt(array $content): string
    {
        $parts = [];
        $this->collectText($content, $parts);

        $text = trim(preg_replace('/\s+/', ' ', implode(' ', $parts)) ?? '');

        return Str::limit($text, 200);
    }

    /**
     * @param  mixed  $node
     * @param  array<int, string>  $parts
     */
    private function collectText($node, array &$parts): void
    {
        if (! is_array($node)) {
            return;
        }

        if (isset($node['text']) && is_string($node['text'])) {
            $parts[] = $node['text'];
        }

        if (isset($node['content']) && is_array($node['content'])) {
            foreach ($node['content'] as $child) {
                $this->collectText($child, $parts);
            }
        }
    }
}

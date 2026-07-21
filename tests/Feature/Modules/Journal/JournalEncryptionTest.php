<?php

use App\Models\CalendarMonthTitle;
use App\Models\User;
use App\Modules\Journal\Models\JournalEntry;
use App\Modules\Journal\Models\JournalTag;
use App\Modules\Journal\Repositories\Eloquent\JournalEntryRepository;
use App\Modules\Journal\Repositories\Eloquent\JournalTagRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

/**
 * The Journal module is the most sensitive content in the app (private diary
 * entries, moods, tags). These prove the content is ciphertext at rest while
 * the app reads it back transparently, that mood stays a queryable plaintext
 * enum, and that encrypted tag names still de-duplicate correctly.
 */
function rawJournalValue(string $table, int $id, string $column): ?string
{
    return DB::table($table)->where('id', $id)->value($column);
}

it('encrypts journal entry title, content and excerpt at rest but keeps mood plaintext', function () {
    $user = User::factory()->create();

    $entry = JournalEntry::create([
        'user_id' => $user->id,
        'entry_date' => '2026-07-21',
        'title' => 'Therapy session reflections',
        'content' => ['type' => 'doc', 'content' => [['type' => 'text', 'text' => 'Deeply private thoughts']]],
        'excerpt' => 'Deeply private thoughts',
        'mood' => 'anxious',
    ]);

    expect(rawJournalValue('journal_entries', $entry->id, 'title'))->not->toContain('Therapy')
        ->and(rawJournalValue('journal_entries', $entry->id, 'content'))->not->toContain('private thoughts')
        ->and(rawJournalValue('journal_entries', $entry->id, 'excerpt'))->not->toContain('private')
        // mood remains plaintext so it can be filtered/indexed in SQL.
        ->and(rawJournalValue('journal_entries', $entry->id, 'mood'))->toBe('anxious');

    $fresh = JournalEntry::find($entry->id);
    expect($fresh->title)->toBe('Therapy session reflections')
        ->and($fresh->content)->toBe(['type' => 'doc', 'content' => [['type' => 'text', 'text' => 'Deeply private thoughts']]])
        ->and($fresh->excerpt)->toBe('Deeply private thoughts')
        ->and($fresh->mood->value)->toBe('anxious');

    // mood is still SQL-queryable.
    expect(JournalEntry::where('mood', 'anxious')->count())->toBe(1);
});

it('encrypts journal tag names but still de-duplicates them case-insensitively', function () {
    $user = User::factory()->create();
    $repo = new JournalTagRepository;

    $entry1 = JournalEntry::create([
        'user_id' => $user->id, 'entry_date' => '2026-07-21',
        'title' => 'One', 'content' => [], 'excerpt' => '',
    ]);
    $entry2 = JournalEntry::create([
        'user_id' => $user->id, 'entry_date' => '2026-07-22',
        'title' => 'Two', 'content' => [], 'excerpt' => '',
    ]);

    $repo->syncByNames($entry1, ['Gratitude', 'Work'], $user->id);
    // Same names, different casing — must reuse the existing tags, not duplicate.
    $repo->syncByNames($entry2, ['gratitude', 'WORK'], $user->id);

    expect(JournalTag::where('user_id', $user->id)->count())->toBe(2);

    $rawName = rawJournalValue('journal_tags', JournalTag::first()->id, 'name');
    expect($rawName)->not->toContain('Gratitude')
        ->and(in_array(Crypt::decryptString($rawName), ['Gratitude', 'Work'], true))->toBeTrue();

    // Sorted-by-decrypted-name listing works.
    expect($repo->allForUser($user->id)->pluck('name')->all())->toBe(['Gratitude', 'Work']);
});

it('searches journal entries by decrypted title with pagination preserved', function () {
    $user = User::factory()->create();
    $repo = new JournalEntryRepository;

    JournalEntry::create(['user_id' => $user->id, 'entry_date' => '2026-07-21', 'title' => 'Morning run notes', 'content' => [], 'excerpt' => '', 'mood' => 'good']);
    JournalEntry::create(['user_id' => $user->id, 'entry_date' => '2026-07-22', 'title' => 'Evening reading', 'content' => [], 'excerpt' => '']);

    $results = $repo->paginateForUser($user->id, ['search' => 'morning'], 15);

    expect($results->total())->toBe(1)
        ->and($results->first()->title)->toBe('Morning run notes');

    // mood filter (plaintext) still narrows via SQL.
    $byMood = $repo->paginateForUser($user->id, ['mood' => 'good'], 15);
    expect($byMood->total())->toBe(1);
});

it('encrypts calendar month title at rest', function () {
    $user = User::factory()->create();

    $monthTitle = CalendarMonthTitle::create([
        'user_id' => $user->id,
        'year' => 2026,
        'month' => 7,
        'title' => 'Sabbatical Month',
    ]);

    expect(rawJournalValue('calendar_month_titles', $monthTitle->id, 'title'))->not->toContain('Sabbatical')
        ->and(CalendarMonthTitle::find($monthTitle->id)->title)->toBe('Sabbatical Month');
});

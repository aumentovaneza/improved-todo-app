<?php

use App\Models\User;
use App\Modules\Journal\Models\JournalEntry;
use App\Modules\Journal\Models\JournalTag;

function tiptapDoc(string $text = 'Hello journal world'): array
{
    return [
        'type' => 'doc',
        'content' => [
            [
                'type' => 'paragraph',
                'content' => [
                    ['type' => 'text', 'text' => $text],
                ],
            ],
        ],
    ];
}

function makeEntry(User $user, array $overrides = []): JournalEntry
{
    return JournalEntry::create(array_merge([
        'user_id' => $user->id,
        'entry_date' => '2026-07-21',
        'title' => 'My day',
        'content' => tiptapDoc(),
        'excerpt' => 'Hello journal world',
        'mood' => 'good',
    ], $overrides));
}

it('creates a journal entry and derives an excerpt', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('journal.store'), [
        'entry_date' => '2026-07-21',
        'title' => 'A great morning',
        'content' => tiptapDoc('Today was a wonderful day of writing.'),
        'mood' => 'great',
        'tags' => ['gratitude', 'morning'],
    ]);

    $response->assertRedirect(route('journal.index'));

    // title is encrypted at rest, so assert plaintext columns via the DB and
    // the encrypted title through the decrypting model.
    $this->assertDatabaseHas('journal_entries', [
        'user_id' => $user->id,
        'mood' => 'great',
    ]);

    $entry = JournalEntry::where('user_id', $user->id)->firstOrFail();
    expect($entry->title)->toBe('A great morning');
    expect($entry->excerpt)->toBe('Today was a wonderful day of writing.');
    expect($entry->tags->pluck('name')->sort()->values()->all())->toBe(['gratitude', 'morning']);
    expect(JournalTag::where('user_id', $user->id)->count())->toBe(2);
});

it('updates a journal entry and syncs tags', function () {
    $user = User::factory()->create();
    $entry = makeEntry($user);
    $oldTag = JournalTag::create(['user_id' => $user->id, 'name' => 'old']);
    $entry->tags()->sync([$oldTag->id]);

    $response = $this->actingAs($user)->put(route('journal.update', $entry->id), [
        'entry_date' => '2026-07-22',
        'title' => 'Updated title',
        'content' => tiptapDoc('New content here.'),
        'mood' => 'okay',
        'tags' => ['new', 'fresh'],
    ]);

    $response->assertRedirect(route('journal.index'));

    $entry->refresh();
    expect($entry->title)->toBe('Updated title');
    expect($entry->mood->value)->toBe('okay');
    expect($entry->excerpt)->toBe('New content here.');
    expect($entry->tags->pluck('name')->sort()->values()->all())->toBe(['fresh', 'new']);

    $this->assertDatabaseHas('journal_entry_journal_tag', [
        'journal_entry_id' => $entry->id,
    ]);
    $this->assertDatabaseMissing('journal_entry_journal_tag', [
        'journal_entry_id' => $entry->id,
        'journal_tag_id' => $oldTag->id,
    ]);
});

it('soft deletes a journal entry', function () {
    $user = User::factory()->create();
    $entry = makeEntry($user);

    $response = $this->actingAs($user)->delete(route('journal.destroy', $entry->id));

    $response->assertRedirect();
    $this->assertSoftDeleted('journal_entries', ['id' => $entry->id]);
});

it('blocks a second user from viewing another users entry', function () {
    $owner = User::factory()->create();
    $intruder = User::factory()->create();
    $entry = makeEntry($owner);

    $this->actingAs($intruder)->get(route('journal.show', $entry->id))->assertNotFound();
    $this->actingAs($intruder)->get(route('journal.edit', $entry->id))->assertNotFound();
    $this->actingAs($intruder)->put(route('journal.update', $entry->id), [
        'entry_date' => '2026-07-22',
        'title' => 'Hijacked',
        'content' => tiptapDoc('nope'),
    ])->assertNotFound();
    $this->actingAs($intruder)->delete(route('journal.destroy', $entry->id))->assertNotFound();

    $this->assertDatabaseHas('journal_entries', [
        'id' => $entry->id,
        'deleted_at' => null,
    ]);
    // title is encrypted; verify the unchanged value through the model.
    expect(JournalEntry::find($entry->id)->title)->toBe('My day');
});

it('index only returns the acting users entries', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    makeEntry($user, ['title' => 'Mine']);
    makeEntry($other, ['title' => 'Theirs']);

    // Request as an Inertia visit so the JSON page object is returned
    // directly (avoids Blade/Vite asset rendering in the test env). Send the
    // asset version the middleware computes so a built manifest doesn't 409.
    $version = app(\App\Http\Middleware\HandleInertiaRequests::class)->version(request());
    $response = $this->actingAs($user)
        ->withHeaders(['X-Inertia' => 'true', 'X-Inertia-Version' => $version])
        ->get(route('journal.index'));

    $response->assertOk();
    $page = $response->json();

    expect($page['component'])->toBe('Journal/Index');
    expect($page['props']['entries']['data'])->toHaveCount(1);
    expect($page['props']['entries']['data'][0]['title'])->toBe('Mine');
});

it('rejects an invalid mood value', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->from(route('journal.create'))
        ->post(route('journal.store'), [
            'entry_date' => '2026-07-21',
            'title' => 'Bad mood',
            'content' => tiptapDoc(),
            'mood' => 'ecstatic',
        ])
        ->assertSessionHasErrors('mood');
});

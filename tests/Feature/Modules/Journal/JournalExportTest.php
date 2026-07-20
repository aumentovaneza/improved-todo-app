<?php

use App\Models\User;
use App\Modules\Journal\Models\JournalEntry;

function docWithText(string $text): array
{
    return [
        'type' => 'doc',
        'content' => [
            ['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => $text]]],
        ],
    ];
}

function makeJournalEntry(User $user, array $overrides = []): JournalEntry
{
    return JournalEntry::create(array_merge([
        'user_id' => $user->id,
        'entry_date' => '2026-07-15',
        'title' => 'Default title',
        'content' => docWithText('Default body text'),
        'excerpt' => 'Default body text',
        'mood' => 'good',
    ], $overrides));
}

/**
 * A .docx is a zip; the readable text lives in word/document.xml. Return that
 * XML so tests can assert which entries made it into the document.
 */
function exportedDocumentXml(string $content): string
{
    $path = tempnam(sys_get_temp_dir(), 'journal').'.docx';
    file_put_contents($path, $content);

    $zip = new ZipArchive;
    $zip->open($path);
    $xml = $zip->getFromName('word/document.xml');
    $zip->close();
    unlink($path);

    return $xml ?: '';
}

it('exports journals as a docx document', function () {
    $user = User::factory()->create();
    makeJournalEntry($user, ['title' => 'A Sunny Day', 'content' => docWithText('It was a lovely afternoon.')]);

    $response = $this->actingAs($user)->get(route('journal.export'));

    $response->assertOk();
    $response->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

    $content = $response->streamedContent();
    expect(substr($content, 0, 2))->toBe('PK'); // docx is a zip archive

    $xml = exportedDocumentXml($content);
    expect($xml)->toContain('A Sunny Day');
    expect($xml)->toContain('It was a lovely afternoon.');
});

it('only exports the requesting user\'s entries', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();

    makeJournalEntry($user, ['title' => 'My Private Entry']);
    makeJournalEntry($other, ['title' => 'Someone Elses Entry']);

    $response = $this->actingAs($user)->get(route('journal.export'));
    $response->assertOk();

    $xml = exportedDocumentXml($response->streamedContent());
    expect($xml)->toContain('My Private Entry');
    expect($xml)->not->toContain('Someone Elses Entry');
});

it('filters journal entries by the entry_date range', function () {
    $user = User::factory()->create();
    makeJournalEntry($user, ['title' => 'InRangeEntry', 'entry_date' => '2026-07-15']);
    makeJournalEntry($user, ['title' => 'OutOfRangeEntry', 'entry_date' => '2026-05-01']);

    $response = $this->actingAs($user)->get(route('journal.export', [
        'start_date' => '2026-07-01',
        'end_date' => '2026-07-31',
    ]));
    $response->assertOk();

    $xml = exportedDocumentXml($response->streamedContent());
    expect($xml)->toContain('InRangeEntry');
    expect($xml)->not->toContain('OutOfRangeEntry');
});

it('returns a valid document even when there are no entries', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('journal.export'));

    $response->assertOk();
    expect(substr($response->streamedContent(), 0, 2))->toBe('PK');
});

it('handles rich content nodes without error', function () {
    $user = User::factory()->create();
    makeJournalEntry($user, [
        'title' => 'Rich Entry',
        'content' => [
            'type' => 'doc',
            'content' => [
                ['type' => 'heading', 'attrs' => ['level' => 2], 'content' => [['type' => 'text', 'text' => 'A Heading']]],
                ['type' => 'paragraph', 'content' => [
                    ['type' => 'text', 'text' => 'bold word', 'marks' => [['type' => 'bold']]],
                    ['type' => 'text', 'text' => ' and a link', 'marks' => [['type' => 'link', 'attrs' => ['href' => 'https://example.com']]]],
                ]],
                ['type' => 'bulletList', 'content' => [
                    ['type' => 'listItem', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'first item']]]]],
                ]],
                ['type' => 'taskList', 'content' => [
                    ['type' => 'taskItem', 'attrs' => ['checked' => true], 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'done task']]]]],
                ]],
                ['type' => 'table', 'content' => [
                    ['type' => 'tableRow', 'content' => [
                        ['type' => 'tableHeader', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Col A']]]]],
                        ['type' => 'tableCell', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Cell A']]]]],
                    ]],
                ]],
            ],
        ],
    ]);

    $response = $this->actingAs($user)->get(route('journal.export'));
    $response->assertOk();

    $xml = exportedDocumentXml($response->streamedContent());
    expect($xml)->toContain('A Heading');
    expect($xml)->toContain('bold word');
    expect($xml)->toContain('first item');
    expect($xml)->toContain('done task');
    expect($xml)->toContain('Col A');
});

it('requires authentication', function () {
    $this->get(route('journal.export'))->assertRedirect(route('login'));
});

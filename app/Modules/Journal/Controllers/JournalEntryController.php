<?php

namespace App\Modules\Journal\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Journal\Enums\JournalMood;
use App\Modules\Journal\Models\JournalEntry;
use App\Modules\Journal\Repositories\Contracts\JournalEntryRepositoryInterface;
use App\Modules\Journal\Repositories\Contracts\JournalTagRepositoryInterface;
use App\Modules\Journal\Requests\StoreJournalEntryRequest;
use App\Modules\Journal\Requests\UpdateJournalEntryRequest;
use App\Modules\Journal\Services\JournalExportService;
use App\Modules\Journal\Services\JournalService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpWord\Writer\Word2007;
use Symfony\Component\HttpFoundation\StreamedResponse;

class JournalEntryController extends Controller
{
    public function __construct(
        private JournalService $journalService,
        private JournalExportService $exportService,
        private JournalEntryRepositoryInterface $entryRepository,
        private JournalTagRepositoryInterface $tagRepository,
    ) {}

    public function index(Request $request): Response
    {
        $userId = Auth::id();
        $filters = $request->only(['search', 'mood', 'tag_id', 'date']);

        $paginator = $this->entryRepository
            ->paginateForUser($userId, $filters)
            ->through(fn (JournalEntry $entry): array => $this->serializeListItem($entry));

        return Inertia::render('Journal/Index', [
            'entries' => $paginator,
            'tags' => $this->serializeTags($userId),
            'moods' => JournalMood::options(),
            'filters' => $filters,
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        $validated = $request->validate([
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ]);

        $startDate = ! empty($validated['start_date']) ? Carbon::parse($validated['start_date']) : null;
        $endDate = ! empty($validated['end_date']) ? Carbon::parse($validated['end_date']) : null;

        $entries = $this->entryRepository->getForUserInRange(Auth::id(), $startDate, $endDate);

        $phpWord = $this->exportService->buildDocx($entries);
        $filename = 'journals-'.now()->format('Y-m-d').'.docx';

        return response()->streamDownload(function () use ($phpWord) {
            (new Word2007($phpWord))->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Journal/Create', [
            'tags' => $this->serializeTags(Auth::id()),
            'moods' => JournalMood::options(),
        ]);
    }

    public function store(StoreJournalEntryRequest $request): RedirectResponse
    {
        $this->journalService->create($request->validated(), Auth::id());

        return redirect()->route('journal.index')->with('message', 'Journal entry created');
    }

    public function show(int $id): Response
    {
        $entry = $this->findOrFail($id);

        return Inertia::render('Journal/Show', [
            'entry' => $this->serializeEntry($entry),
            'moods' => JournalMood::options(),
        ]);
    }

    public function edit(int $id): Response
    {
        $entry = $this->findOrFail($id);

        return Inertia::render('Journal/Edit', [
            'entry' => $this->serializeEntry($entry),
            'tags' => $this->serializeTags(Auth::id()),
            'moods' => JournalMood::options(),
        ]);
    }

    public function update(UpdateJournalEntryRequest $request, int $id): RedirectResponse
    {
        $entry = $this->findOrFail($id);

        $this->journalService->update($entry, $request->validated(), Auth::id());

        return redirect()->route('journal.index')->with('message', 'Journal entry updated');
    }

    public function destroy(int $id): RedirectResponse
    {
        $entry = $this->findOrFail($id);

        $this->journalService->delete($entry, Auth::id());

        return redirect()->back()->with('message', 'Journal entry deleted');
    }

    private function findOrFail(int $id): JournalEntry
    {
        $entry = $this->entryRepository->findForUser($id, Auth::id());

        if (! $entry) {
            abort(404);
        }

        return $entry;
    }

    /**
     * List-payload shape (content omitted for size).
     *
     * @return array<string, mixed>
     */
    private function serializeListItem(JournalEntry $entry): array
    {
        return [
            'id' => $entry->id,
            'entry_date' => $entry->entry_date?->format('Y-m-d'),
            'title' => $entry->title,
            'excerpt' => $entry->excerpt,
            'mood' => $entry->mood?->value,
            'tags' => $entry->tags->map(fn ($tag): array => [
                'id' => $tag->id,
                'name' => $tag->name,
                'color' => $tag->color,
            ])->values()->all(),
        ];
    }

    /**
     * Full entry payload (includes TipTap content) for show/edit.
     *
     * @return array<string, mixed>
     */
    private function serializeEntry(JournalEntry $entry): array
    {
        return [
            'id' => $entry->id,
            'entry_date' => $entry->entry_date?->format('Y-m-d'),
            'title' => $entry->title,
            'content' => $entry->content,
            'excerpt' => $entry->excerpt,
            'mood' => $entry->mood?->value,
            'tags' => $entry->tags->map(fn ($tag): array => [
                'id' => $tag->id,
                'name' => $tag->name,
                'color' => $tag->color,
            ])->values()->all(),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function serializeTags(int $userId): array
    {
        return $this->tagRepository->allForUser($userId)
            ->map(fn ($tag): array => [
                'id' => $tag->id,
                'name' => $tag->name,
                'color' => $tag->color,
            ])->values()->all();
    }
}

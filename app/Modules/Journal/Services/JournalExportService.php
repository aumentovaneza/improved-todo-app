<?php

namespace App\Modules\Journal\Services;

use App\Modules\Journal\Models\JournalEntry;
use Illuminate\Support\Collection;
use PhpOffice\PhpWord\Element\Section;
use PhpOffice\PhpWord\Element\Table;
use PhpOffice\PhpWord\Element\TextRun;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\Style\Font;
use PhpOffice\PhpWord\Style\ListItem;

/**
 * Converts journal entries — whose `content` column is TipTap ProseMirror JSON
 * (NOT HTML/markdown) — into a Word document. The node/mark set handled here
 * mirrors resources/js/Components/Journal/journalExtensions.js. Anything richer
 * than Word can cleanly represent (footnotes, task lists, remote images)
 * degrades gracefully rather than being dropped.
 */
class JournalExportService
{
    /** @var array<int, string> Footnote bodies collected while walking the current entry. */
    private array $footnotes = [];

    /**
     * @param  Collection<int, JournalEntry>|iterable<JournalEntry>  $entries
     */
    public function buildDocx(iterable $entries): PhpWord
    {
        $phpWord = new PhpWord;
        $phpWord->addTitleStyle(1, ['bold' => true, 'size' => 18], ['spaceAfter' => 120]);
        $phpWord->addTitleStyle(2, ['bold' => true, 'size' => 15], ['spaceBefore' => 120]);
        $phpWord->addTitleStyle(3, ['bold' => true, 'size' => 13], ['spaceBefore' => 80]);

        $section = $phpWord->addSection();
        $first = true;

        foreach ($entries as $entry) {
            if (! $first) {
                $section->addPageBreak();
            }
            $first = false;

            $this->renderEntry($section, $entry);
        }

        if ($first) {
            // No entries at all — still return a valid, non-empty document.
            $section->addText('No journal entries found for the selected range.', ['italic' => true, 'color' => '888888']);
        }

        return $phpWord;
    }

    private function renderEntry(Section $section, JournalEntry $entry): void
    {
        $this->footnotes = [];

        $section->addTitle($entry->title !== '' && $entry->title !== null ? $entry->title : 'Untitled', 1);

        $meta = $entry->entry_date?->format('F j, Y') ?? '';
        if ($entry->mood) {
            $meta = trim($meta.'   '.$entry->mood->emoji().' '.$entry->mood->label());
        }
        if ($meta !== '') {
            $section->addText($meta, ['italic' => true, 'color' => '666666']);
        }

        if ($entry->tags->isNotEmpty()) {
            $section->addText('Tags: '.$entry->tags->pluck('name')->implode(', '), ['size' => 9, 'color' => '888888']);
        }

        $section->addTextBreak();

        $content = is_array($entry->content) ? $entry->content : [];
        $this->renderBlocks($section, $content['content'] ?? []);

        $this->renderFootnotes($section);
    }

    /**
     * @param  array<int, mixed>  $nodes
     */
    private function renderBlocks(Section $section, array $nodes): void
    {
        foreach ($nodes as $node) {
            if (! is_array($node)) {
                continue;
            }
            $this->renderBlock($section, $node);
        }
    }

    /**
     * @param  array<string, mixed>  $node
     */
    private function renderBlock(Section $section, array $node): void
    {
        switch ($node['type'] ?? '') {
            case 'heading':
                $level = (int) ($node['attrs']['level'] ?? 2);
                $level = max(1, min(3, $level));
                $text = $this->plainText($node);
                $section->addTitle($text === '' ? ' ' : $text, $level);
                break;

            case 'paragraph':
                $run = $section->addTextRun();
                $this->renderInline($run, $node['content'] ?? []);
                break;

            case 'blockquote':
                foreach ($node['content'] ?? [] as $child) {
                    if (! is_array($child)) {
                        continue;
                    }
                    $run = $section->addTextRun(['indentation' => ['left' => 480]]);
                    $this->renderInline($run, $child['content'] ?? [], ['italic' => true, 'color' => '555555']);
                }
                break;

            case 'bulletList':
                $this->renderList($section, $node, ordered: false);
                break;

            case 'orderedList':
                $this->renderList($section, $node, ordered: true);
                break;

            case 'taskList':
                $this->renderTaskList($section, $node);
                break;

            case 'codeBlock':
                $section->addText($this->plainText($node), ['name' => 'Courier New', 'size' => 10]);
                break;

            case 'horizontalRule':
                $section->addText('────────────────────────────', ['color' => 'CCCCCC']);
                break;

            case 'image':
                $src = $node['attrs']['src'] ?? '';
                $section->addText('🖼 Image: '.$src, ['italic' => true, 'color' => '888888']);
                break;

            case 'table':
                $this->renderTable($section, $node);
                break;

            case 'footnotes':
                foreach ($node['content'] ?? [] as $footnote) {
                    if (is_array($footnote)) {
                        $this->footnotes[] = $this->plainText($footnote);
                    }
                }
                break;

            default:
                // Unknown block: recurse into children so nothing is silently lost.
                if (! empty($node['content']) && is_array($node['content'])) {
                    $this->renderBlocks($section, $node['content']);
                } elseif (($text = $this->plainText($node)) !== '') {
                    $section->addText($text);
                }
                break;
        }
    }

    /**
     * @param  array<int, mixed>  $nodes
     * @param  array<string, mixed>  $baseFont
     */
    private function renderInline(TextRun $run, array $nodes, array $baseFont = []): void
    {
        foreach ($nodes as $node) {
            if (! is_array($node)) {
                continue;
            }

            $type = $node['type'] ?? '';

            if ($type === 'hardBreak') {
                $run->addTextBreak();

                continue;
            }

            if ($type === 'footnoteReference') {
                $this->footnotes[] = '';
                $run->addText('['.count($this->footnotes).']', ['superScript' => true, 'size' => 8]);

                continue;
            }

            if ($type === 'text' && isset($node['text'])) {
                [$font, $href] = $this->buildFontStyle($node['marks'] ?? [], $baseFont);

                if ($href !== null) {
                    $run->addLink($href, $node['text'], $font);
                } else {
                    $run->addText($node['text'], $font);
                }

                continue;
            }

            // Nested inline container: recurse.
            if (! empty($node['content']) && is_array($node['content'])) {
                $this->renderInline($run, $node['content'], $baseFont);
            }
        }
    }

    /**
     * @param  array<string, mixed>  $node
     */
    private function renderList(Section $section, array $node, bool $ordered, int $depth = 0): void
    {
        $listType = $ordered ? ListItem::TYPE_NUMBER : ListItem::TYPE_BULLET_FILLED;

        foreach ($node['content'] ?? [] as $item) {
            if (! is_array($item)) {
                continue;
            }

            foreach ($item['content'] ?? [] as $child) {
                if (! is_array($child)) {
                    continue;
                }

                $childType = $child['type'] ?? '';
                if ($childType === 'bulletList' || $childType === 'orderedList') {
                    $this->renderList($section, $child, $childType === 'orderedList', $depth + 1);

                    continue;
                }

                $section->addListItem($this->plainText($child), $depth, [], ['listType' => $listType]);
            }
        }
    }

    /**
     * @param  array<string, mixed>  $node
     */
    private function renderTaskList(Section $section, array $node, int $depth = 0): void
    {
        foreach ($node['content'] ?? [] as $item) {
            if (! is_array($item)) {
                continue;
            }

            $checked = (bool) ($item['attrs']['checked'] ?? false);
            $prefix = str_repeat('    ', $depth).($checked ? '☒ ' : '☐ ');

            foreach ($item['content'] ?? [] as $child) {
                if (! is_array($child)) {
                    continue;
                }

                $childType = $child['type'] ?? '';
                if ($childType === 'taskList') {
                    $this->renderTaskList($section, $child, $depth + 1);

                    continue;
                }

                $section->addText($prefix.$this->plainText($child));
            }
        }
    }

    /**
     * @param  array<string, mixed>  $node
     */
    private function renderTable(Section $section, array $node): void
    {
        /** @var Table $table */
        $table = $section->addTable([
            'borderSize' => 6,
            'borderColor' => 'BBBBBB',
            'cellMargin' => 60,
        ]);

        foreach ($node['content'] ?? [] as $row) {
            if (! is_array($row) || ($row['type'] ?? '') !== 'tableRow') {
                continue;
            }

            $table->addRow();

            foreach ($row['content'] ?? [] as $cell) {
                if (! is_array($cell)) {
                    continue;
                }

                $isHeader = ($cell['type'] ?? '') === 'tableHeader';
                $cellElement = $table->addCell(2500, $isHeader ? ['bgColor' => 'F2F2F2'] : []);
                $text = $this->plainText($cell);
                $cellElement->addText($text, $isHeader ? ['bold' => true] : []);
            }
        }
    }

    private function renderFootnotes(Section $section): void
    {
        $bodies = array_values(array_filter($this->footnotes, fn ($body) => $body !== ''));

        if ($bodies === []) {
            return;
        }

        $section->addTextBreak();
        $section->addTitle('Footnotes', 3);

        foreach ($bodies as $index => $body) {
            $section->addText(($index + 1).'. '.$body, ['size' => 9, 'color' => '555555']);
        }
    }

    /**
     * Build a PHPWord font-style array from a TipTap mark list. Returns the
     * style plus an optional link href (link is rendered via addLink, not addText).
     *
     * @param  array<int, mixed>  $marks
     * @param  array<string, mixed>  $baseFont
     * @return array{0: array<string, mixed>, 1: ?string}
     */
    private function buildFontStyle(array $marks, array $baseFont = []): array
    {
        $font = $baseFont;
        $href = null;

        foreach ($marks as $mark) {
            if (! is_array($mark)) {
                continue;
            }

            $attrs = $mark['attrs'] ?? [];

            switch ($mark['type'] ?? '') {
                case 'bold':
                    $font['bold'] = true;
                    break;
                case 'italic':
                    $font['italic'] = true;
                    break;
                case 'underline':
                    $font['underline'] = Font::UNDERLINE_SINGLE;
                    break;
                case 'strike':
                    $font['strikethrough'] = true;
                    break;
                case 'code':
                    $font['name'] = 'Courier New';
                    break;
                case 'link':
                    $href = is_string($attrs['href'] ?? null) ? $attrs['href'] : null;
                    break;
                case 'highlight':
                    if ($color = $this->sanitizeHex($attrs['color'] ?? null)) {
                        $font['bgColor'] = $color;
                    }
                    break;
                case 'textStyle':
                    if ($color = $this->sanitizeHex($attrs['color'] ?? null)) {
                        $font['color'] = $color;
                    }
                    if (! empty($attrs['fontFamily']) && is_string($attrs['fontFamily'])) {
                        $font['name'] = $attrs['fontFamily'];
                    }
                    if ($size = $this->parseFontSize($attrs['fontSize'] ?? null)) {
                        $font['size'] = $size;
                    }
                    break;
            }
        }

        return [$font, $href];
    }

    private function sanitizeHex(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $hex = ltrim(trim($value), '#');

        if (preg_match('/^[0-9a-fA-F]{6}$/', $hex)) {
            return strtoupper($hex);
        }

        if (preg_match('/^[0-9a-fA-F]{3}$/', $hex)) {
            // Expand shorthand (#abc → aabbcc).
            return strtoupper($hex[0].$hex[0].$hex[1].$hex[1].$hex[2].$hex[2]);
        }

        return null;
    }

    private function parseFontSize(mixed $value): ?int
    {
        if (! is_string($value) && ! is_numeric($value)) {
            return null;
        }

        if (! preg_match('/([0-9]+(?:\.[0-9]+)?)/', (string) $value, $matches)) {
            return null;
        }

        $number = (float) $matches[1];

        // Values are stored as CSS pixels; Word sizes are points (≈ px * 0.75).
        if (str_contains((string) $value, 'px')) {
            $number *= 0.75;
        }

        $points = (int) round($number);

        return $points > 0 ? $points : null;
    }

    /**
     * Recursively collect plain text from a TipTap node (mirrors
     * JournalService::collectText).
     *
     * @param  mixed  $node
     */
    private function plainText($node): string
    {
        $parts = [];
        $this->collectText($node, $parts);

        return trim(preg_replace('/\s+/', ' ', implode(' ', $parts)) ?? '');
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

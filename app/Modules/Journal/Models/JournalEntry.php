<?php

namespace App\Modules\Journal\Models;

use App\Models\User;
use App\Modules\Journal\Enums\JournalMood;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Journal entry.
 *
 * Extension point: a future attachments feature is planned as a HasMany
 * relationship backed by a `journal_attachments` table
 * (journal_entry_id, disk, path, mime, size). Add an `attachments()`
 * HasMany here and a matching migration under this module's
 * database/migrations directory — nothing else needs reshaping.
 */
class JournalEntry extends Model
{
    use SoftDeletes;

    protected $table = 'journal_entries';

    protected $fillable = [
        'user_id',
        'entry_date',
        'title',
        'content',
        'excerpt',
        'mood',
    ];

    protected $casts = [
        'entry_date' => 'date',
        'title' => 'encrypted',
        'content' => 'encrypted:array',
        'excerpt' => 'encrypted',
        // mood stays plaintext: it is a low-cardinality enum filtered in SQL
        // (where('mood', ...)) and backs an index, like task status/priority.
        'mood' => JournalMood::class,
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(JournalTag::class, 'journal_entry_journal_tag');
    }
}

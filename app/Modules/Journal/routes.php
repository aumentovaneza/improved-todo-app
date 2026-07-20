<?php

use App\Modules\Journal\Controllers\JournalEntryController;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', 'auth'])->group(function () {
    // Must precede the resource route so `journal/export` is not captured by `journal/{journal}`.
    Route::get('journal/export', [JournalEntryController::class, 'export'])->name('journal.export');
    Route::resource('journal', JournalEntryController::class);
});

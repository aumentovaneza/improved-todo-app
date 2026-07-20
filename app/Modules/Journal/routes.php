<?php

use App\Modules\Journal\Controllers\JournalEntryController;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', 'auth'])->group(function () {
    Route::resource('journal', JournalEntryController::class);
});

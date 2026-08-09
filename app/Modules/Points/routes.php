<?php

use App\Modules\Points\Controllers\PomodoroSessionController;
use App\Modules\Points\Controllers\StoreController;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', 'auth'])->group(function () {
    Route::get('store', [StoreController::class, 'index'])->name('store.index');
    Route::post('store/purchase', [StoreController::class, 'purchase'])->name('store.purchase');
    Route::post('store/equip', [StoreController::class, 'equip'])->name('store.equip');

    Route::post('pomodoro/sessions', [PomodoroSessionController::class, 'store'])
        ->name('pomodoro.sessions.store');
});

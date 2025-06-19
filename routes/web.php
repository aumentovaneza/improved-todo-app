<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\SubtaskController;
use App\Http\Controllers\ReminderController;
use App\Http\Controllers\DashboardController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

// Main todo app routes
Route::middleware(['auth', 'verified'])->group(function () {
    // Tasks
    Route::resource('tasks', TaskController::class)->except(['create', 'show', 'edit']);
    Route::post('tasks/{task}/toggle-status', [TaskController::class, 'toggleStatus'])->name('tasks.toggle-status');
    Route::post('tasks/reorder', [TaskController::class, 'reorder'])->name('tasks.reorder');

    // Categories
    Route::resource('categories', CategoryController::class);

    // Subtasks
    Route::post('subtasks', [SubtaskController::class, 'store'])->name('subtasks.store');
    Route::put('subtasks/{subtask}', [SubtaskController::class, 'update'])->name('subtasks.update');
    Route::delete('subtasks/{subtask}', [SubtaskController::class, 'destroy'])->name('subtasks.destroy');
    Route::post('subtasks/{subtask}/toggle', [SubtaskController::class, 'toggle'])->name('subtasks.toggle');
    Route::post('subtasks/reorder', [SubtaskController::class, 'reorder'])->name('subtasks.reorder');

    // Reminders
    Route::resource('reminders', ReminderController::class);

    // Admin routes
    Route::prefix('admin')->name('admin.')->group(function () {
        Route::get('/', [AdminController::class, 'dashboard'])->name('dashboard');
        Route::get('users', [AdminController::class, 'users'])->name('users.index');
        Route::get('users/create', [AdminController::class, 'createUser'])->name('users.create');
        Route::post('users', [AdminController::class, 'storeUser'])->name('users.store');
        Route::get('users/{user}/edit', [AdminController::class, 'editUser'])->name('users.edit');
        Route::put('users/{user}', [AdminController::class, 'updateUser'])->name('users.update');
        Route::delete('users/{user}', [AdminController::class, 'deleteUser'])->name('users.destroy');
        Route::get('categories', [AdminController::class, 'categories'])->name('categories.index');
        Route::get('activity-logs', [AdminController::class, 'activityLogs'])->name('activity-logs.index');
    });
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__ . '/auth.php';

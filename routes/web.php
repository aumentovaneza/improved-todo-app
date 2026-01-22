<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\TagController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\SubtaskController;
use App\Http\Controllers\ReminderController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\GoogleCalendarController;
use App\Http\Controllers\WorkspaceController;
use App\Http\Controllers\BoardController;
use App\Http\Controllers\SwimlaneController;
use App\Modules\Finance\Controllers\FinanceBudgetController;
use App\Modules\Finance\Controllers\FinanceAccountController;
use App\Modules\Finance\Controllers\FinanceCategoryController;
use App\Modules\Finance\Controllers\FinanceDashboardController;
use App\Modules\Finance\Controllers\FinanceLoanController;
use App\Modules\Finance\Controllers\FinanceReportController;
use App\Modules\Finance\Controllers\FinanceSavingsGoalController;
use App\Modules\Finance\Controllers\FinanceTransactionController;
use App\Modules\Finance\Controllers\FinanceWalletCollaboratorController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
        'status' => session('status'),
        'canResetPassword' => Route::has('password.request'),
    ]);
});

Route::get('/offline', function () {
    return redirect('/offline.html');
})->name('offline');

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

    // Tags
    Route::resource('tags', TagController::class);
    Route::get('api/tags', [TagController::class, 'getAllTags'])->name('api.tags');

    // News Category API
    Route::get('api/user/news-category', [ProfileController::class, 'getNewsCategory'])->name('api.user.news-category');
    Route::post('api/user/news-category', [ProfileController::class, 'updateNewsCategory'])->name('api.user.news-category.update');

    // Subtasks
    Route::post('subtasks', [SubtaskController::class, 'store'])->name('subtasks.store');
    Route::put('subtasks/{subtask}', [SubtaskController::class, 'update'])->name('subtasks.update');
    Route::delete('subtasks/{subtask}', [SubtaskController::class, 'destroy'])->name('subtasks.destroy');
    Route::post('subtasks/{subtask}/toggle', [SubtaskController::class, 'toggle'])->name('subtasks.toggle');
    Route::post('subtasks/reorder', [SubtaskController::class, 'reorder'])->name('subtasks.reorder');

    // Reminders
    Route::resource('reminders', ReminderController::class);

    // Calendar
    Route::get('calendar', [CalendarController::class, 'index'])->name('calendar.index');

    // Analytics
    Route::get('analytics', [AnalyticsController::class, 'index'])->name('analytics.index');

    // Finance
    Route::get('weviewallet', [FinanceDashboardController::class, 'index'])->name('weviewallet.dashboard');
    Route::post('weviewallet/collaborators', [FinanceWalletCollaboratorController::class, 'store'])
        ->name('weviewallet.collaborators.store');
    Route::delete('weviewallet/collaborators/{user}', [FinanceWalletCollaboratorController::class, 'destroy'])
        ->name('weviewallet.collaborators.destroy');
    Route::get('weviewallet/transactions', [FinanceTransactionController::class, 'indexPage'])
        ->name('weviewallet.transactions.index');
    Route::get('weviewallet/budgets', [FinanceBudgetController::class, 'indexPage'])
        ->name('weviewallet.budgets.index');
    Route::get('weviewallet/accounts', [FinanceAccountController::class, 'indexPage'])
        ->name('weviewallet.accounts.index');
    Route::get('weviewallet/savings-goals', [FinanceSavingsGoalController::class, 'indexPage'])
        ->name('weviewallet.savings-goals.index');
    Route::get('weviewallet/loans', [FinanceLoanController::class, 'indexPage'])
        ->name('weviewallet.loans.index');
    Route::prefix('weviewallet/api')->name('weviewallet.api.')->group(function () {
        Route::get('collaborators/search', [FinanceWalletCollaboratorController::class, 'search'])
            ->name('collaborators.search');
        Route::get('transactions', [FinanceTransactionController::class, 'index'])->name('transactions.index');
        Route::get('transactions/grouped', [FinanceTransactionController::class, 'grouped'])
            ->name('transactions.grouped');
        Route::get('transactions/related', [FinanceTransactionController::class, 'related'])
            ->name('transactions.related');
        Route::post('transactions', [FinanceTransactionController::class, 'store'])->name('transactions.store');
        Route::put('transactions/{transaction}', [FinanceTransactionController::class, 'update'])->name('transactions.update');
        Route::delete('transactions/{transaction}', [FinanceTransactionController::class, 'destroy'])->name('transactions.destroy');

        Route::get('categories', [FinanceCategoryController::class, 'index'])->name('categories.index');
        Route::post('categories', [FinanceCategoryController::class, 'store'])->name('categories.store');
        Route::put('categories/{category}', [FinanceCategoryController::class, 'update'])->name('categories.update');
        Route::delete('categories/{category}', [FinanceCategoryController::class, 'destroy'])->name('categories.destroy');

        Route::get('budgets', [FinanceBudgetController::class, 'index'])->name('budgets.index');
        Route::post('budgets', [FinanceBudgetController::class, 'store'])->name('budgets.store');
        Route::put('budgets/{budget}', [FinanceBudgetController::class, 'update'])->name('budgets.update');
        Route::delete('budgets/{budget}', [FinanceBudgetController::class, 'destroy'])->name('budgets.destroy');
        Route::post('budgets/{budget}/delete', [FinanceBudgetController::class, 'destroyWithReallocation'])
            ->name('budgets.delete');
        Route::post('budgets/{budget}/close', [FinanceBudgetController::class, 'close'])
            ->name('budgets.close');

        Route::get('accounts', [FinanceAccountController::class, 'index'])->name('accounts.index');
        Route::post('accounts', [FinanceAccountController::class, 'store'])->name('accounts.store');
        Route::put('accounts/{account}', [FinanceAccountController::class, 'update'])->name('accounts.update');
        Route::delete('accounts/{account}', [FinanceAccountController::class, 'destroy'])->name('accounts.destroy');

        Route::get('savings-goals', [FinanceSavingsGoalController::class, 'index'])->name('savings-goals.index');
        Route::post('savings-goals', [FinanceSavingsGoalController::class, 'store'])->name('savings-goals.store');
        Route::put('savings-goals/{savingsGoal}', [FinanceSavingsGoalController::class, 'update'])->name('savings-goals.update');
        Route::delete('savings-goals/{savingsGoal}', [FinanceSavingsGoalController::class, 'destroy'])->name('savings-goals.destroy');
        Route::post('savings-goals/{savingsGoal}/convert', [FinanceSavingsGoalController::class, 'convert'])
            ->name('savings-goals.convert');

        Route::get('loans', [FinanceLoanController::class, 'index'])->name('loans.index');
        Route::post('loans', [FinanceLoanController::class, 'store'])->name('loans.store');
        Route::put('loans/{loan}', [FinanceLoanController::class, 'update'])->name('loans.update');
        Route::delete('loans/{loan}', [FinanceLoanController::class, 'destroy'])->name('loans.destroy');

        Route::get('reports/summary', [FinanceReportController::class, 'summary'])->name('reports.summary');
        Route::post('reports', [FinanceReportController::class, 'store'])->name('reports.store');
    });

    // Workspaces
    Route::resource('workspaces', WorkspaceController::class)->except(['create', 'edit']);
    Route::post('workspaces/{workspace}/collaborators', [WorkspaceController::class, 'addCollaborator'])->name('workspaces.collaborators.store');
    Route::delete('workspaces/{workspace}/collaborators/{user}', [WorkspaceController::class, 'removeCollaborator'])->name('workspaces.collaborators.destroy');

    // Boards
    Route::get('workspaces/{workspace}/boards/{board}', [BoardController::class, 'show'])->name('boards.show');
    Route::post('workspaces/{workspace}/boards', [BoardController::class, 'store'])->name('boards.store');
    Route::put('workspaces/{workspace}/boards/{board}', [BoardController::class, 'update'])->name('boards.update');
    Route::delete('workspaces/{workspace}/boards/{board}', [BoardController::class, 'destroy'])->name('boards.destroy');
    Route::post('workspaces/{workspace}/boards/{board}/move-task', [BoardController::class, 'moveTask'])->name('boards.move-task');
    Route::post('workspaces/{workspace}/boards/{board}/tasks', [BoardController::class, 'storeTask'])->name('boards.tasks.store');
    Route::put('workspaces/{workspace}/boards/{board}/tasks/{task}', [BoardController::class, 'updateTask'])->name('boards.tasks.update');
    Route::post('workspaces/{workspace}/boards/{board}/collaborators', [BoardController::class, 'addCollaborator'])->name('boards.collaborators.store');
    Route::delete('workspaces/{workspace}/boards/{board}/collaborators/{user}', [BoardController::class, 'removeCollaborator'])->name('boards.collaborators.destroy');

    // Swimlanes
    Route::post('workspaces/{workspace}/boards/{board}/swimlanes', [SwimlaneController::class, 'store'])->name('swimlanes.store');
    Route::put('workspaces/{workspace}/boards/{board}/swimlanes/{swimlane}', [SwimlaneController::class, 'update'])->name('swimlanes.update');
    Route::delete('workspaces/{workspace}/boards/{board}/swimlanes/{swimlane}', [SwimlaneController::class, 'destroy'])->name('swimlanes.destroy');
    Route::post('workspaces/{workspace}/boards/{board}/swimlanes/reorder', [SwimlaneController::class, 'reorder'])->name('swimlanes.reorder');

    // Admin routes - only accessible by admin users
    Route::prefix('admin')->name('admin.')->middleware('admin')->group(function () {
        Route::get('/', [AdminController::class, 'dashboard'])->name('dashboard');
        Route::get('users', [AdminController::class, 'users'])->name('users.index');
        Route::get('users/create', [AdminController::class, 'createUser'])->name('users.create');
        Route::post('users', [AdminController::class, 'storeUser'])->name('users.store');
        Route::get('users/{user}/edit', [AdminController::class, 'editUser'])->name('users.edit');
        Route::put('users/{user}', [AdminController::class, 'updateUser'])->name('users.update');
        Route::delete('users/{user}', [AdminController::class, 'deleteUser'])->name('users.destroy');
        Route::get('activity-logs', [AdminController::class, 'activityLogs'])->name('activity-logs.index');

        // Invite codes
        Route::get('invite-codes', [AdminController::class, 'inviteCodes'])->name('invite-codes.index');
        Route::get('invite-codes/create', [AdminController::class, 'createInviteCode'])->name('invite-codes.create');
        Route::post('invite-codes', [AdminController::class, 'storeInviteCode'])->name('invite-codes.store');
        Route::patch('invite-codes/{inviteCode}/deactivate', [AdminController::class, 'deactivateInviteCode'])->name('invite-codes.deactivate');
        Route::patch('invite-codes/{inviteCode}/reactivate', [AdminController::class, 'reactivateInviteCode'])->name('invite-codes.reactivate');
    });
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'show'])->name('profile.show');
    Route::get('/profile/edit', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::get('/profile/weviewallet', [ProfileController::class, 'weviewalletManagement'])
        ->name('profile.weviewallet');
    Route::get('/profile/finance-categories', [ProfileController::class, 'financeCategories'])
        ->name('profile.finance-categories');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('/google/redirect', [GoogleCalendarController::class, 'redirect'])->name('google.redirect');
    Route::get('/google/callback', [GoogleCalendarController::class, 'callback'])->name('google.callback');
});

require __DIR__ . '/auth.php';

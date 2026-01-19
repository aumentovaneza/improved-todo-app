<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Modules\Finance\Models\FinanceCategory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile.
     */
    public function show(Request $request): Response
    {
        $user = $request->user();

        // Get some basic stats for the user
        $stats = [
            'total_tasks' => $user->tasks()->count(),
            'completed_tasks' => $user->tasks()->where('status', 'completed')->count(),
            'pending_tasks' => $user->tasks()->where('status', 'pending')->count(),
            'overdue_tasks' => $user->tasks()
                ->where('status', 'pending')
                ->where('due_date', '<', now())
                ->count(),
        ];

        return Inertia::render('Profile/Show', [
            'user' => $user,
            'stats' => $stats,
        ]);
    }

    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
        ]);
    }

    /**
     * Display finance categories editor.
     */
    public function financeCategories(Request $request): Response
    {
        $categories = FinanceCategory::where('user_id', $request->user()->id)
            ->orderBy('type')
            ->orderBy('name')
            ->get();

        return Inertia::render('Profile/FinanceCategories', [
            'categories' => $categories,
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('profile.edit');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }

    /**
     * Get the user's news category preference.
     */
    public function getNewsCategory(Request $request)
    {
        return response()->json([
            'news_category' => $request->user()->news_category ?? 'general'
        ]);
    }

    /**
     * Update the user's news category preference.
     */
    public function updateNewsCategory(Request $request)
    {
        $request->validate([
            'news_category' => 'required|string|in:business,entertainment,general,health,science,sports,technology'
        ]);

        $request->user()->update([
            'news_category' => $request->news_category
        ]);

        return response()->json([
            'message' => 'News category updated successfully',
            'news_category' => $request->news_category
        ]);
    }
}

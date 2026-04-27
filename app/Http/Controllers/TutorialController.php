<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

class TutorialController extends Controller
{
    public function update(Request $request, string $key): RedirectResponse
    {
        $validated = $request->validate([
            'step' => ['nullable', 'integer', 'min:0'],
            'completed' => ['nullable', 'boolean'],
            'skipped' => ['nullable', 'boolean'],
        ]);

        $user = Auth::user();
        $progress = $user->tutorial_progress ?? [];

        $current = $progress[$key] ?? [
            'step' => 0,
            'completed' => false,
            'skipped' => false,
            'started_at' => now()->toIso8601String(),
        ];

        $progress[$key] = array_merge($current, array_filter($validated, fn ($v) => $v !== null));

        if (! empty($validated['completed'])) {
            $progress[$key]['completed_at'] = now()->toIso8601String();
        }

        $user->forceFill(['tutorial_progress' => $progress])->save();

        return back();
    }

    public function reset(Request $request, string $key): RedirectResponse
    {
        $user = Auth::user();
        $progress = $user->tutorial_progress ?? [];

        $progress[$key] = [
            'step' => 0,
            'completed' => false,
            'skipped' => false,
            'started_at' => now()->toIso8601String(),
        ];

        $user->forceFill(['tutorial_progress' => $progress])->save();

        return redirect()->route('dashboard');
    }
}

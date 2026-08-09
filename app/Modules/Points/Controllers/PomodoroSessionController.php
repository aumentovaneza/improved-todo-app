<?php

namespace App\Modules\Points\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Points\Requests\StorePomodoroSessionRequest;
use App\Modules\Points\Services\PomodoroSessionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

class PomodoroSessionController extends Controller
{
    public function __construct(
        private PomodoroSessionService $pomodoroService,
    ) {}

    public function store(StorePomodoroSessionRequest $request): RedirectResponse
    {
        $this->pomodoroService->record(Auth::user(), $request->validated());

        return back();
    }
}

<?php

namespace App\Http\Controllers;

use App\Services\SampleDataService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

class SampleDataController extends Controller
{
    public function __construct(private SampleDataService $sampleData) {}

    /**
     * Remove the current user's clearly-marked sample tasks and categories.
     */
    public function destroy(): RedirectResponse
    {
        $this->sampleData->clearFor(Auth::user());

        return back()->with('success', 'Sample data cleared.');
    }
}

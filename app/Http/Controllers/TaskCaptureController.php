<?php

namespace App\Http\Controllers;

use App\Services\Ai\AiEntitlementService;
use App\Services\Ai\Exceptions\TaskExtractionException;
use App\Services\Ai\TaskExtractionService;
use App\Services\CategoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TaskCaptureController extends Controller
{
    public function __construct(
        private TaskExtractionService $extractionService,
        private AiEntitlementService $entitlement,
        private CategoryService $categoryService,
    ) {}

    /**
     * Turn a natural-language description into a structured task payload the
     * client uses to pre-fill the task modal. Returns JSON (not an Inertia
     * redirect) because the frontend needs the extracted fields, not a page.
     */
    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (! $this->entitlement->canUse($user, 'task_capture')) {
            return response()->json([
                'message' => 'AI task capture is a Pro feature.',
            ], 403);
        }

        $validated = $request->validate([
            'input' => 'required|string|max:500',
        ]);

        $categories = $this->categoryService->getActiveCategoriesForUser($user->id);

        try {
            $task = $this->extractionService->extract($user, $validated['input'], $categories);
        } catch (TaskExtractionException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['task' => $task]);
    }
}

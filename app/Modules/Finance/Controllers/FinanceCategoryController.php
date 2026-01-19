<?php

namespace App\Modules\Finance\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Finance\Models\FinanceCategory;
use App\Modules\Finance\Repositories\FinanceCategoryRepository;
use App\Modules\Finance\Services\FinanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FinanceCategoryController extends Controller
{
    public function __construct(
        private FinanceService $financeService,
        private FinanceCategoryRepository $categoryRepository
    ) {}

    public function index(): JsonResponse
    {
        $categories = $this->categoryRepository->getForUser(Auth::id());

        return response()->json($categories);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:income,expense,savings'],
            'color' => ['nullable', 'string', 'max:20'],
            'icon' => ['nullable', 'string', 'max:50'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $category = $this->financeService->createCategory($validated, Auth::id());

        return response()->json($category, 201);
    }

    public function update(Request $request, FinanceCategory $category): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'type' => ['nullable', 'in:income,expense,savings'],
            'color' => ['nullable', 'string', 'max:20'],
            'icon' => ['nullable', 'string', 'max:50'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $updated = $this->financeService->updateCategory($category, $validated, Auth::id());

        return response()->json($updated);
    }

    public function destroy(FinanceCategory $category): JsonResponse
    {
        $this->financeService->deleteCategory($category, Auth::id());

        return response()->json(['status' => 'deleted']);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Tag;
use App\Models\ActivityLog;
use App\Services\CategoryService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function __construct(
        private CategoryService $categoryService
    ) {}

    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $categories = $this->categoryService->getCategoriesWithTaskCounts(Auth::id());

        return Inertia::render('Categories/Index', [
            'categories' => $categories,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('Categories/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'color' => 'required|string|regex:/^#[0-9A-F]{6}$/i',
            'description' => 'nullable|string',
            'tags' => 'nullable|array',
            'tags.*.name' => 'required|string|max:255',
            'tags.*.color' => 'required|string|regex:/^#[0-9A-F]{6}$/i',
            'tags.*.is_new' => 'boolean',
        ]);

        try {
            $category = $this->categoryService->createCategory($validated, Auth::id());
            return redirect()->route('categories.index')->with('message', 'Category created successfully');
        } catch (\InvalidArgumentException $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()])->withInput();
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => 'Failed to create category. Please try again.'])->withInput();
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Category $category): Response
    {
        $categoryWithTasks = $this->categoryService->getCategoryWithTasks($category->id, Auth::id());

        if (!$categoryWithTasks) {
            abort(404);
        }

        return Inertia::render('Categories/Show', [
            'category' => $categoryWithTasks,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Category $category): Response
    {
        $categoryData = $this->categoryService->findCategoryForUser($category->id, Auth::id());

        if (!$categoryData) {
            abort(404);
        }

        // Prepare category data with properly structured tags for frontend
        $formattedCategory = $categoryData->toArray();

        // Ensure tags have the proper structure for the TagInput component
        if ($categoryData->tags) {
            $formattedCategory['tags'] = $categoryData->tags->map(function ($tag) {
                return [
                    'id' => $tag->id,
                    'name' => $tag->name,
                    'color' => $tag->color,
                    'description' => $tag->description,
                    'is_new' => false, // Mark existing tags as not new
                ];
            })->toArray();
        } else {
            $formattedCategory['tags'] = [];
        }

        return Inertia::render('Categories/Edit', [
            'category' => $formattedCategory,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Category $category): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'color' => 'required|string|regex:/^#[0-9A-F]{6}$/i',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'tags' => 'nullable|array',
            'tags.*.name' => 'required|string|max:255',
            'tags.*.color' => 'required|string|regex:/^#[0-9A-F]{6}$/i',
            'tags.*.is_new' => 'boolean',
            'tags.*.id' => 'nullable|exists:tags,id',
        ]);

        try {
            $this->categoryService->updateCategory($category, $validated, Auth::id());
            return redirect()->route('categories.index')->with('message', 'Category updated successfully');
        } catch (\InvalidArgumentException $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()])->withInput();
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => 'Failed to update category. Please try again.'])->withInput();
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Category $category): RedirectResponse
    {
        try {
            $this->categoryService->deleteCategory($category, Auth::id());
            return redirect()->route('categories.index')->with('message', 'Category deleted successfully');
        } catch (\InvalidArgumentException $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => 'Failed to delete category. Please try again.']);
        }
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Tag;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $categories = Category::withCount(['tasks' => function ($query) {
            $query->where('user_id', Auth::id());
        }])
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

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
            'name' => 'required|string|max:255|unique:categories,name',
            'color' => 'required|string|regex:/^#[0-9A-F]{6}$/i',
            'description' => 'nullable|string',
            'tags' => 'nullable|array',
            'tags.*.name' => 'required|string|max:255',
            'tags.*.color' => 'required|string|regex:/^#[0-9A-F]{6}$/i',
            'tags.*.is_new' => 'boolean',
        ]);

        $category = Category::create($validated);

        // Handle tags
        if (isset($validated['tags'])) {
            $tagIds = [];
            foreach ($validated['tags'] as $tagData) {
                if (isset($tagData['is_new']) && $tagData['is_new']) {
                    // Create new tag
                    $tag = Tag::firstOrCreate(
                        ['name' => $tagData['name']],
                        [
                            'color' => $tagData['color'],
                            'description' => $tagData['description'] ?? null,
                        ]
                    );
                    $tagIds[] = $tag->id;
                } else {
                    // Existing tag (if we have an id)
                    if (isset($tagData['id'])) {
                        $tagIds[] = $tagData['id'];
                    }
                }
            }
            $category->tags()->attach($tagIds);
        }

        // Log activity
        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'create',
            'model_type' => 'Category',
            'model_id' => $category->id,
            'new_values' => $validated,
            'description' => "Created category: {$category->name}",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return redirect()->route('categories.index')->with('message', 'Category created successfully');
    }

    /**
     * Display the specified resource.
     */
    public function show(Category $category): Response
    {
        return Inertia::render('Categories/Show', [
            'category' => $category->load(['tasks' => function ($query) {
                $query->where('user_id', Auth::id())
                    ->with('tags')
                    ->orderByRaw("
                        CASE 
                            WHEN status = 'pending' THEN 1
                            WHEN status = 'in_progress' THEN 2
                            WHEN status = 'completed' THEN 3
                            WHEN status = 'cancelled' THEN 4
                            ELSE 5
                        END
                    ")
                    ->orderByRaw("
                        CASE priority
                            WHEN 'urgent' THEN 1
                            WHEN 'high' THEN 2
                            WHEN 'medium' THEN 3
                            WHEN 'low' THEN 4
                            ELSE 5
                        END
                    ")
                    ->orderBy('position')
                    ->orderBy('created_at', 'desc');
            }, 'tags']),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Category $category): Response
    {
        // Load category with tags
        $category->load('tags');

        // Prepare category data with properly structured tags for frontend
        $categoryData = $category->toArray();

        // Ensure tags have the proper structure for the TagInput component
        if ($category->tags) {
            $categoryData['tags'] = $category->tags->map(function ($tag) {
                return [
                    'id' => $tag->id,
                    'name' => $tag->name,
                    'color' => $tag->color,
                    'description' => $tag->description,
                    'is_new' => false, // Mark existing tags as not new
                ];
            })->toArray();
        } else {
            $categoryData['tags'] = [];
        }

        return Inertia::render('Categories/Edit', [
            'category' => $categoryData,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Category $category): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:categories,name,' . $category->id,
            'color' => 'required|string|regex:/^#[0-9A-F]{6}$/i',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'tags' => 'nullable|array',
            'tags.*.name' => 'required|string|max:255',
            'tags.*.color' => 'required|string|regex:/^#[0-9A-F]{6}$/i',
            'tags.*.is_new' => 'boolean',
            'tags.*.id' => 'nullable|exists:tags,id',
        ]);

        $oldValues = $category->toArray();
        $category->update($validated);

        // Handle tags
        if (isset($validated['tags'])) {
            $tagIds = [];
            foreach ($validated['tags'] as $tagData) {
                if (isset($tagData['is_new']) && $tagData['is_new'] === true) {
                    // Create new tag
                    $tag = Tag::firstOrCreate(
                        ['name' => $tagData['name']],
                        [
                            'color' => $tagData['color'],
                            'description' => $tagData['description'] ?? null,
                        ]
                    );
                    $tagIds[] = $tag->id;
                } elseif (isset($tagData['id'])) {
                    // Existing tag with ID
                    $tagIds[] = $tagData['id'];
                } else {
                    // Fallback: try to find existing tag by name
                    $existingTag = Tag::where('name', $tagData['name'])->first();
                    if ($existingTag) {
                        $tagIds[] = $existingTag->id;
                    } else {
                        // Create as new tag if not found
                        $tag = Tag::create([
                            'name' => $tagData['name'],
                            'color' => $tagData['color'],
                            'description' => $tagData['description'] ?? null,
                        ]);
                        $tagIds[] = $tag->id;
                    }
                }
            }
            $category->tags()->sync($tagIds);
        } else {
            $category->tags()->detach();
        }

        // Log activity
        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'update',
            'model_type' => 'Category',
            'model_id' => $category->id,
            'old_values' => $oldValues,
            'new_values' => $validated,
            'description' => "Updated category: {$category->name}",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return redirect()->route('categories.index')->with('message', 'Category updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Category $category): RedirectResponse
    {
        $categoryName = $category->name;
        $category->delete();

        // Log activity
        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'delete',
            'model_type' => 'Category',
            'model_id' => $category->id,
            'description' => "Deleted category: {$categoryName}",
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);

        return redirect()->route('categories.index')->with('message', 'Category deleted successfully');
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Tag;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class TagController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $tags = Tag::withCount(['categories', 'tasks'])
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return Inertia::render('Tags/Index', [
            'tags' => $tags,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('Tags/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:tags,name',
            'color' => 'required|string|regex:/^#[0-9A-F]{6}$/i',
            'description' => 'nullable|string',
        ]);

        $tag = Tag::create($validated);

        return redirect()->route('tags.index')->with('message', 'Tag created successfully');
    }

    /**
     * Display the specified resource.
     */
    public function show(Tag $tag): Response
    {
        return Inertia::render('Tags/Show', [
            'tag' => $tag->load(['categories', 'tasks' => function ($query) {
                $query->where('user_id', Auth::id());
            }]),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Tag $tag): Response
    {
        return Inertia::render('Tags/Edit', [
            'tag' => $tag,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Tag $tag): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:tags,name,'.$tag->id,
            'color' => 'required|string|regex:/^#[0-9A-F]{6}$/i',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $tag->update($validated);

        return redirect()->route('tags.index')->with('message', 'Tag updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Tag $tag): RedirectResponse
    {
        $tag->delete();

        return redirect()->route('tags.index')->with('message', 'Tag deleted successfully');
    }

    /**
     * Get all active tags for API/AJAX requests
     */
    public function getAllTags()
    {
        return response()->json(Tag::active()->orderBy('name')->get());
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\ListItem;
use App\Services\ListItemService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ListItemController extends Controller
{
    public function __construct(
        private ListItemService $listItemService
    ) {}

    /**
     * Redirect back to the originating page, never to a list-item endpoint.
     *
     * The list-item routes are POST/PUT/DELETE only — there is no GET
     * /list-items — so a plain back() that resolves to the request's own URL
     * leaves Inertia following a 302 into a dead endpoint. Guard against
     * self-redirects and any list-items path, falling back to the lists index.
     */
    private function redirectBack(): RedirectResponse
    {
        $previous = url()->previous();
        $path = ltrim(parse_url($previous, PHP_URL_PATH) ?? '', '/');

        if ($previous === url()->current() || str_starts_with($path, 'list-items')) {
            return redirect()->route('lists.index');
        }

        return redirect()->to($previous);
    }

    /**
     * Whether the request is a plain background XHR (not an Inertia visit)
     * expecting a JSON response.
     */
    private function wantsJson(Request $request): bool
    {
        return ! $request->hasHeader('X-Inertia') && $request->expectsJson();
    }

    public function store(Request $request): RedirectResponse|JsonResponse
    {
        try {
            $validated = $request->validate([
                'task_list_id' => 'required|exists:task_lists,id',
                'content' => 'required|string|max:255',
            ]);

            $item = $this->listItemService->createItem($validated, Auth::id());

            $payload = $item->only([
                'id',
                'content',
                'is_completed',
                'completed_at',
                'position',
                'task_list_id',
            ]);

            if ($this->wantsJson($request)) {
                return response()->json([
                    'item' => $payload,
                    'message' => 'Item created successfully',
                ]);
            }

            return $this->redirectBack()
                ->with('message', 'Item created successfully')
                ->with('item', $payload);
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            report($e);

            if ($this->wantsJson($request)) {
                return response()->json([
                    'error' => 'Failed to create item: '.$e->getMessage(),
                ], 500);
            }

            return $this->redirectBack()->withErrors(['error' => 'Failed to create item: '.$e->getMessage()]);
        }
    }

    public function update(Request $request, ListItem $listItem): RedirectResponse|JsonResponse
    {
        try {
            $validated = $request->validate([
                'content' => 'required|string|max:255',
                'is_completed' => 'boolean',
            ]);

            $updatedItem = $this->listItemService->updateItem($listItem, $validated, Auth::id());

            $payload = $updatedItem->only([
                'id',
                'content',
                'is_completed',
                'completed_at',
                'position',
                'task_list_id',
            ]);

            if ($this->wantsJson($request)) {
                return response()->json([
                    'item' => $payload,
                    'message' => 'Item updated successfully',
                ]);
            }

            return $this->redirectBack()->with('message', 'Item updated successfully');
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            report($e);

            if ($this->wantsJson($request)) {
                return response()->json([
                    'error' => 'Failed to update item: '.$e->getMessage(),
                ], 500);
            }

            return $this->redirectBack()->withErrors(['error' => 'Failed to update item: '.$e->getMessage()]);
        }
    }

    public function destroy(Request $request, ListItem $listItem): RedirectResponse|JsonResponse
    {
        try {
            $this->listItemService->deleteItem($listItem, Auth::id());

            if ($this->wantsJson($request)) {
                return response()->json([
                    'deleted' => true,
                    'message' => 'Item deleted successfully',
                ]);
            }

            return $this->redirectBack()->with('message', 'Item deleted successfully');
        } catch (\Exception $e) {
            report($e);

            if ($this->wantsJson($request)) {
                return response()->json([
                    'error' => 'Failed to delete item: '.$e->getMessage(),
                ], 500);
            }

            return $this->redirectBack()->withErrors(['error' => 'Failed to delete item: '.$e->getMessage()]);
        }
    }

    public function toggle(Request $request, ListItem $listItem): RedirectResponse|JsonResponse
    {
        try {
            $updatedItem = $this->listItemService->toggleItem($listItem, Auth::id());
            $message = $updatedItem->is_completed ? 'Item completed!' : 'Item marked as pending';

            $payload = $updatedItem->only([
                'id',
                'content',
                'is_completed',
                'completed_at',
                'position',
                'task_list_id',
            ]);

            if ($this->wantsJson($request)) {
                return response()->json([
                    'item' => $payload,
                    'message' => $message,
                ]);
            }

            return $this->redirectBack()->with('message', $message);
        } catch (\Exception $e) {
            report($e);

            if ($this->wantsJson($request)) {
                return response()->json([
                    'error' => 'Failed to toggle item: '.$e->getMessage(),
                ], 500);
            }

            return $this->redirectBack()->withErrors(['error' => 'Failed to toggle item: '.$e->getMessage()]);
        }
    }

    public function reorder(Request $request): RedirectResponse|JsonResponse
    {
        try {
            $validated = $request->validate([
                'itemIds' => 'required|array',
                'itemIds.*' => 'exists:list_items,id',
            ]);

            $this->listItemService->reorderItems($validated['itemIds'], Auth::id());

            if ($this->wantsJson($request)) {
                return response()->json([
                    'message' => 'Items reordered successfully',
                ]);
            }

            return $this->redirectBack()->with('message', 'Items reordered successfully');
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            report($e);

            if ($this->wantsJson($request)) {
                return response()->json([
                    'error' => 'Failed to reorder items: '.$e->getMessage(),
                ], 500);
            }

            return $this->redirectBack()->withErrors(['error' => 'Failed to reorder items: '.$e->getMessage()]);
        }
    }
}

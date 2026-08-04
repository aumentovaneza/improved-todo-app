<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'notifications' => fn () => $this->notificationsFor($request),
            'flash' => [
                'subtask' => fn () => $request->session()->get('subtask'),
                'message' => fn () => $request->session()->get('message'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }

    /**
     * Recent in-app notifications + unread count for the bell.
     *
     * @return array{items: array<int, array<string, mixed>>, unread_count: int}
     */
    protected function notificationsFor(Request $request): array
    {
        $user = $request->user();

        if (! $user) {
            return ['items' => [], 'unread_count' => 0];
        }

        $items = $user->notifications()->latest()->limit(15)->get()->map(fn ($n) => [
            'id' => $n->id,
            'title' => $n->data['title'] ?? 'Notification',
            'body' => $n->data['body'] ?? '',
            'type' => $n->data['type'] ?? 'general',
            'read' => $n->read_at !== null,
            'created_at' => $n->created_at?->toIso8601String(),
        ])->all();

        return [
            'items' => $items,
            'unread_count' => $user->unreadNotifications()->count(),
        ];
    }
}

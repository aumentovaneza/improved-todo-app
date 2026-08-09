<?php

namespace App\Http\Middleware;

use App\Modules\Points\Services\AvatarService;
use App\Modules\Points\Services\PointsWalletService;
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
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
                'unreadNotifications' => $user ? $user->unreadNotifications()->count() : 0,
                // Points balance + streak, exposed on every authenticated page.
                'points' => $user ? $this->pointsProps($user->id) : null,
                // Avatar kept alongside (not nested in the user) so the user
                // serialization is untouched. Phase 1: base layer + initials.
                'avatar' => $user ? app(AvatarService::class)->presentFor($user->id) : null,
            ],
            'flash' => [
                'subtask' => fn () => $request->session()->get('subtask'),
                'message' => fn () => $request->session()->get('message'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'webPush' => [
                // Public VAPID key so the browser can subscribe. Safe to expose;
                // the private key stays server-side. Null when unconfigured.
                'vapidPublicKey' => config('services.vapid.public_key'),
            ],
        ];
    }

    /**
     * @return array{balance: int, streak: int}
     */
    private function pointsProps(int $userId): array
    {
        $wallet = app(PointsWalletService::class)->ensureWallet($userId);

        return [
            'balance' => (int) $wallet->balance,
            'streak' => (int) $wallet->current_streak_days,
        ];
    }
}

<?php

namespace App\Services;

use App\Models\PushToken;
use App\Models\User;

class DeviceTokenService
{
    /**
     * Register (upsert) a device token for a user.
     *
     * Idempotent per (user_id, token): an existing row for the same token has
     * its platform/provider/meta refreshed and last_used_at touched; otherwise
     * a new row is created.
     *
     * @param  array{platform: string, provider: string, token: string, meta?: array<string, mixed>|null}  $data
     */
    public function register(User $user, array $data): PushToken
    {
        return $user->pushTokens()->updateOrCreate(
            ['token' => $data['token']],
            [
                'platform' => $data['platform'],
                'provider' => $data['provider'],
                'meta' => $data['meta'] ?? null,
                'last_used_at' => now(),
            ],
        );
    }

    /**
     * Remove a device token for a user (e.g. on logout / unregister).
     */
    public function delete(User $user, string $token): void
    {
        $user->pushTokens()
            ->where('token', $token)
            ->delete();
    }
}

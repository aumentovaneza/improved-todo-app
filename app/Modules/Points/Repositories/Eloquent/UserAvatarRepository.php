<?php

namespace App\Modules\Points\Repositories\Eloquent;

use App\Modules\Points\Models\UserAvatar;
use App\Modules\Points\Repositories\Contracts\UserAvatarRepositoryInterface;

class UserAvatarRepository implements UserAvatarRepositoryInterface
{
    public function getForUser(int $userId): ?UserAvatar
    {
        return UserAvatar::query()
            ->with('baseItem')
            ->where('user_id', $userId)
            ->first();
    }

    public function ensureForUser(int $userId): UserAvatar
    {
        return UserAvatar::query()->firstOrCreate(['user_id' => $userId]);
    }

    public function upsertForUser(int $userId, array $data): UserAvatar
    {
        $avatar = UserAvatar::query()->firstOrCreate(['user_id' => $userId]);
        $avatar->fill($data);
        $avatar->save();

        return $avatar;
    }
}

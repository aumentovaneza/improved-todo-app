<?php

namespace App\Modules\Points\Repositories\Contracts;

use App\Modules\Points\Models\UserAvatar;

interface UserAvatarRepositoryInterface
{
    public function getForUser(int $userId): ?UserAvatar;

    public function ensureForUser(int $userId): UserAvatar;

    /**
     * @param  array<string, mixed>  $data
     */
    public function upsertForUser(int $userId, array $data): UserAvatar;
}

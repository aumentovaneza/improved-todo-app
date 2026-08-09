<?php

namespace App\Modules\Points\Services;

use App\Models\User;
use App\Modules\Points\Repositories\Contracts\UserAvatarRepositoryInterface;
use Illuminate\Support\Str;

class AvatarService
{
    public function __construct(
        private UserAvatarRepositoryInterface $avatars,
    ) {}

    /**
     * The shared avatar prop shape. Phase 1 exposes the base layer URL plus a
     * token-colored initials fallback the frontend renders when no art exists.
     *
     * @return array{base_url: string|null, initials: string}
     */
    public function presentFor(int $userId): array
    {
        $avatar = $this->avatars->getForUser($userId);
        $baseItem = $avatar?->baseItem;

        return [
            'base_url' => $this->assetUrl($baseItem?->asset),
            'initials' => $this->initialsFor($userId),
        ];
    }

    private function assetUrl(?string $path): ?string
    {
        if ($path === null || $path === '') {
            return null;
        }

        return asset('images/avatars/'.$path);
    }

    private function initialsFor(int $userId): string
    {
        $user = User::query()->select(['id', 'name', 'email'])->find($userId);

        $name = trim((string) ($user?->name ?? ''));

        if ($name !== '') {
            $parts = preg_split('/\s+/', $name) ?: [];
            $first = Str::substr($parts[0] ?? '', 0, 1);
            $second = count($parts) > 1 ? Str::substr($parts[count($parts) - 1], 0, 1) : '';

            $initials = Str::upper($first.$second);

            if ($initials !== '') {
                return $initials;
            }
        }

        $email = (string) ($user?->email ?? '');

        return $email !== '' ? Str::upper(Str::substr($email, 0, 1)) : '?';
    }
}

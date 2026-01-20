<?php

namespace App\Modules\Finance\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;

class FinanceWalletService
{
    public function resolveWalletUserId(User $user, ?int $walletUserId): int
    {
        if (!$walletUserId) {
            return $user->id;
        }

        if ($this->canAccessWalletById($user->id, $walletUserId)) {
            return $walletUserId;
        }

        return $user->id;
    }

    public function canAccessWalletById(int $userId, int $walletUserId): bool
    {
        if ($userId === $walletUserId) {
            return true;
        }

        return DB::table('finance_wallet_collaborators')
            ->where('owner_user_id', $walletUserId)
            ->where('collaborator_user_id', $userId)
            ->exists();
    }

    public function ensureCanAccessWallet(int $userId, int $walletUserId): void
    {
        if (!$this->canAccessWalletById($userId, $walletUserId)) {
            throw new UnauthorizedHttpException('', 'You do not have access to this wallet.');
        }
    }

    public function getAccessibleWallets(User $user): array
    {
        $owned = [[
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'type' => 'owned',
        ]];

        $collaborating = $user->collaboratingWallets()
            ->get(['users.id', 'users.name', 'users.email'])
            ->map(fn (User $wallet) => [
                'id' => $wallet->id,
                'name' => $wallet->name,
                'email' => $wallet->email,
                'type' => 'shared',
            ])
            ->values()
            ->all();

        return array_values(array_merge($owned, $collaborating));
    }
}

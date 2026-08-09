<?php

namespace App\Modules\Points\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Points\Models\PointLedgerEntry;
use App\Modules\Points\Repositories\Contracts\PointLedgerRepositoryInterface;
use App\Modules\Points\Services\PointsWalletService;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class PointsController extends Controller
{
    public function __construct(
        private PointsWalletService $walletService,
        private PointLedgerRepositoryInterface $ledger,
    ) {}

    public function index(): Response
    {
        $user = Auth::user();
        $wallet = $this->walletService->ensureWallet($user->id);

        $ledger = $this->ledger->paginateForUser($user->id)
            ->through(fn (PointLedgerEntry $entry): array => [
                'id' => (int) $entry->id,
                'type' => $entry->type->value,
                'source' => $entry->source->value,
                'source_label' => $entry->source->label(),
                'amount' => (int) $entry->amount,
                'balance_after' => (int) $entry->balance_after,
                'created_at' => $entry->created_at->toIso8601String(),
            ]);

        return Inertia::render('Points/Index', [
            'balance' => (int) $wallet->balance,
            'streak' => (int) $wallet->current_streak_days,
            'ledger' => $ledger,
        ]);
    }
}

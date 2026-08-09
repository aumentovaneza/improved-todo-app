<?php

namespace App\Modules\Points\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Points\Exceptions\InsufficientBalanceException;
use App\Modules\Points\Repositories\Contracts\StoreItemRepositoryInterface;
use App\Modules\Points\Requests\EquipAvatarRequest;
use App\Modules\Points\Requests\PurchaseStoreItemRequest;
use App\Modules\Points\Services\PointsWalletService;
use App\Modules\Points\Services\StoreService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class StoreController extends Controller
{
    public function __construct(
        private StoreService $storeService,
        private PointsWalletService $walletService,
        private StoreItemRepositoryInterface $storeItems,
    ) {}

    public function index(): Response
    {
        $user = Auth::user();
        $wallet = $this->walletService->ensureWallet($user->id);

        return Inertia::render('Store/Index', [
            'items' => $this->storeService->listCatalogFor($user),
            'balance' => (int) $wallet->balance,
        ]);
    }

    public function purchase(PurchaseStoreItemRequest $request): RedirectResponse
    {
        $user = Auth::user();
        $storeItem = $this->storeItems->findById((int) $request->validated('store_item_id'));

        if (! $storeItem) {
            return back()->with('error', 'This item is not available.');
        }

        try {
            $this->storeService->purchase(
                $user,
                $storeItem,
                (string) $request->validated('client_request_id'),
            );
        } catch (InsufficientBalanceException $e) {
            return back()->with('error', 'You do not have enough points for this item.');
        }

        return back()->with('message', 'Purchase complete!');
    }

    public function equip(EquipAvatarRequest $request): RedirectResponse
    {
        $user = Auth::user();
        $storeItem = $this->storeItems->findById((int) $request->validated('store_item_id'));

        if (! $storeItem) {
            return back()->with('error', 'This item is not available.');
        }

        $this->storeService->equip($user, $storeItem);

        return back()->with('message', 'Avatar updated.');
    }
}

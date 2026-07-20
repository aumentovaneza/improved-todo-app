<?php

namespace App\Modules\Finance\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Finance\Services\FinanceExportService;
use App\Modules\Finance\Services\FinanceWalletService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FinanceExportController extends Controller
{
    public function __construct(
        private FinanceExportService $exportService,
        private FinanceWalletService $walletService,
    ) {}

    public function exportExcel(Request $request): StreamedResponse
    {
        $validated = $request->validate([
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'wallet_user_id' => ['nullable', 'integer'],
        ]);

        $user = $request->user();
        $walletUserId = $this->walletService->resolveWalletUserId(
            $user,
            $request->integer('wallet_user_id') ?: null
        );
        $this->walletService->ensureCanAccessWallet($user->id, $walletUserId);

        $startDate = ! empty($validated['start_date']) ? Carbon::parse($validated['start_date']) : null;
        $endDate = ! empty($validated['end_date']) ? Carbon::parse($validated['end_date']) : null;

        $spreadsheet = $this->exportService->build(
            $walletUserId,
            $startDate,
            $endDate,
            maskAccountNumbers: $walletUserId !== $user->id,
        );

        $filename = 'weviewallet-'.now()->format('Y-m-d').'.xlsx';

        return response()->streamDownload(function () use ($spreadsheet) {
            (new Xlsx($spreadsheet))->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }
}

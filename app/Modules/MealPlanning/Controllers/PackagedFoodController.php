<?php

namespace App\Modules\MealPlanning\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\MealPlanning\Models\Household;
use App\Modules\MealPlanning\Models\PackagedFood;
use App\Modules\MealPlanning\Requests\ProviderLookupRequest;
use App\Modules\MealPlanning\Services\HouseholdAccessService;
use App\Modules\MealPlanning\Services\ProviderImportService;
use App\Modules\MealPlanning\Services\ProviderRegistry;

class PackagedFoodController extends Controller
{
    public function __construct(private HouseholdAccessService $access, private ProviderRegistry $providers, private ProviderImportService $imports) {}

    public function lookup(ProviderLookupRequest $request, Household $household)
    {
        $this->access->ensureMember($household, $request->user());
        $barcode = $this->normalizeBarcode((string) $request->validated('barcode'));
        if ($local = PackagedFood::with(['servings', 'nutrition'])->where('barcode', $barcode)->first()) {
            return response()->json(['data' => $local, 'meta' => ['source' => 'local']]);
        }
        foreach ($this->providers->packagedFoods() as $provider) {
            try {
                if ($provider->enabled() && ($data = $provider->findByBarcode($barcode))) {
                    return response()->json(['data' => $this->imports->importPackagedFood($data), 'meta' => ['source' => $provider->name()]]);
                }
            } catch (\Throwable $exception) {
                report($exception);
            }
        }

        return response()->json(['data' => null, 'meta' => ['manual_entry_required' => true, 'warning' => 'No local or provider product matched this barcode.']]);
    }

    private function normalizeBarcode(string $barcode): string
    {
        $digits = ltrim(preg_replace('/\D/', '', $barcode) ?? '', '0');
        if (strlen($digits) <= 7) {
            return str_pad($digits, 8, '0', STR_PAD_LEFT);
        }
        if (strlen($digits) <= 12) {
            return str_pad($digits, 13, '0', STR_PAD_LEFT);
        }

        return $digits;
    }
}

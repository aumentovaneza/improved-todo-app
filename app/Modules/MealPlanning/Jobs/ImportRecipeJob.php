<?php

namespace App\Modules\MealPlanning\Jobs;

use App\Modules\MealPlanning\Services\ProviderImportService;
use App\Modules\MealPlanning\Services\ProviderRegistry;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use RuntimeException;

class ImportRecipeJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 4;

    public array $backoff = [1, 2, 4, 8];

    public function __construct(public string $provider, public string $externalId, public int $userId) {}

    public function handle(ProviderRegistry $providers, ProviderImportService $imports): void
    {
        // Provider acquisition intentionally finishes before the normalized
        // persistence transaction starts inside ProviderImportService.
        $data = $providers->recipe($this->provider)->find($this->externalId);
        if (! $data) {
            throw new RuntimeException('Provider recipe was not found.');
        }
        $imports->importRecipe($data, null, $this->userId);
    }
}

<?php

namespace App\Modules\MealPlanning\Providers\Concerns;

use App\Modules\MealPlanning\Models\MealProviderRequest;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\RateLimiter;
use RuntimeException;
use Throwable;

trait CallsMealProvider
{
    abstract public function name(): string;

    protected function request(string $operation, callable $callback): array
    {
        $circuitKey = 'meal-provider-circuit:'.$this->name();
        if (Cache::get($circuitKey)) {
            throw new RuntimeException("{$this->name()} provider circuit is temporarily open.");
        }

        $started = hrtime(true);
        try {
            $rateKey = 'meal-provider-rate:'.$this->name();
            $limit = (int) config('services.meal_planning.rate_limits.'.$this->name(), 60);
            if (RateLimiter::tooManyAttempts($rateKey, $limit)) {
                throw new RuntimeException("{$this->name()} provider rate limit reached.");
            }
            RateLimiter::hit($rateKey, 60);
            $response = $callback($this->http());
            $duration = (int) ((hrtime(true) - $started) / 1_000_000);
            $response->throw();
            $this->record($operation, $response->status(), $duration, true);
            Cache::forget('meal-provider-failures:'.$this->name());

            return $response->json() ?? [];
        } catch (Throwable $exception) {
            $failures = (int) Cache::increment('meal-provider-failures:'.$this->name());
            Cache::put('meal-provider-failures:'.$this->name(), $failures, now()->addMinutes(10));
            if ($failures >= 5) {
                Cache::put($circuitKey, true, now()->addMinutes(5));
            }
            $this->record($operation, null, (int) ((hrtime(true) - $started) / 1_000_000), false, $exception->getMessage());
            throw $exception;
        }
    }

    protected function http(): PendingRequest
    {
        return Http::acceptJson()->timeout(10)->retry(3, fn (int $attempt) => 250 * (2 ** ($attempt - 1)), throw: false);
    }

    private function record(string $operation, ?int $status, int $duration, bool $successful, ?string $error = null): void
    {
        if (class_exists(MealProviderRequest::class)) {
            MealProviderRequest::query()->create([
                'provider' => $this->name(), 'operation' => $operation, 'status_code' => $status,
                'duration_ms' => $duration, 'successful' => $successful, 'error' => $error,
            ]);
        }
    }
}

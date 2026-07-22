<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\DailySummary>
 */
class DailySummaryFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'summary_date' => now()->toDateString(),
            'content' => fake()->sentence(),
            'provider' => 'anthropic',
            'model' => 'claude-sonnet-5',
            'generated_at' => now(),
        ];
    }
}

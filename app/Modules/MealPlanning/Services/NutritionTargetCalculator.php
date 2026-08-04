<?php

namespace App\Modules\MealPlanning\Services;

use App\Modules\MealPlanning\Models\HouseholdMember;
use Carbon\Carbon;

class NutritionTargetCalculator
{
    public const VERSION = 'nasem-eer-2023-v1';

    /** @return array{targets: array<string, float>, warnings: array<int, string>, source: string, version: string} */
    public function calculate(HouseholdMember $member): array
    {
        $stored = $member->nutrition_targets ?? [];
        if (in_array($member->target_source, ['manual', 'professional'], true) && isset($stored['calories'])) {
            return ['targets' => $this->withMacros((float) $stored['calories'], $member, $stored), 'warnings' => [], 'source' => $member->target_source, 'version' => self::VERSION];
        }

        $warnings = [];
        $age = $member->birth_date ? Carbon::parse($member->birth_date)->age : null;
        foreach (['sex_at_birth', 'height_cm', 'weight_kg', 'activity_level'] as $field) {
            if ($member->{$field} === null) {
                $warnings[] = "Missing {$field}; enter a manual target or complete the profile.";
            }
        }
        if ($age === null) {
            $warnings[] = 'Missing birth date; enter a manual target or complete the profile.';
        }
        if ($age !== null && $age < 3) {
            $warnings[] = 'Automatic targets are not provided for children under three; use a professional target.';
        }
        if ($warnings) {
            return ['targets' => $stored, 'warnings' => $warnings, 'source' => 'unavailable', 'version' => self::VERSION];
        }

        $calories = $this->eer($member->sex_at_birth, $age, (float) $member->height_cm, (float) $member->weight_kg, $member->activity_level);
        if (! $member->isChild() && $member->calorie_counting_enabled) {
            $adjustment = min(500.0, $calories * 0.10);
            if ($member->nutrition_goal === 'gradual_loss') {
                $calories -= $adjustment;
            }
            if ($member->nutrition_goal === 'gradual_gain') {
                $calories += $adjustment;
            }
        } elseif ($member->isChild() && in_array($member->nutrition_goal, ['gradual_loss', 'gradual_gain'], true)) {
            $warnings[] = 'Child targets remain maintenance-oriented unless a professional target is supplied.';
        }

        return ['targets' => $this->withMacros(round($calories), $member, []), 'warnings' => $warnings, 'source' => 'derived', 'version' => self::VERSION];
    }

    private function eer(string $sex, int $age, float $height, float $weight, string $activity): float
    {
        $adult = $age >= 19;
        $coefficients = match ([$adult, $sex, $activity]) {
            [true, 'female', 'sedentary'] => [584.90, -7.01, 5.72, 11.71],
            [true, 'female', 'low_active'] => [575.77, -7.01, 6.60, 12.14],
            [true, 'female', 'active'] => [710.25, -7.01, 6.54, 12.34],
            [true, 'female', 'very_active'] => [511.83, -7.01, 9.07, 12.56],
            [true, 'male', 'sedentary'] => [753.07, -10.83, 6.50, 14.10],
            [true, 'male', 'low_active'] => [581.47, -10.83, 8.30, 14.94],
            [true, 'male', 'active'] => [1004.82, -10.83, 6.52, 15.91],
            [true, 'male', 'very_active'] => [-517.88, -10.83, 15.61, 19.11],
            [false, 'female', 'sedentary'] => [55.59, -22.25, 8.43, 17.07],
            [false, 'female', 'low_active'] => [-297.54, -22.25, 12.77, 14.73],
            [false, 'female', 'active'] => [-189.55, -22.25, 11.74, 18.34],
            [false, 'female', 'very_active'] => [-709.59, -22.25, 18.22, 14.25],
            [false, 'male', 'sedentary'] => [-447.51, 3.68, 13.01, 13.15],
            [false, 'male', 'low_active'] => [19.12, 3.68, 8.62, 20.28],
            [false, 'male', 'active'] => [-388.19, 3.68, 12.66, 20.46],
            default => [-671.75, 3.68, 15.38, 23.25],
        };

        return max(0, $coefficients[0] + ($coefficients[1] * $age) + ($coefficients[2] * $height) + ($coefficients[3] * $weight));
    }

    private function withMacros(float $calories, HouseholdMember $member, array $overrides): array
    {
        $age = $member->birth_date ? Carbon::parse($member->birth_date)->age : 99;
        $ratios = $member->isChild() && $age < 4
            ? ['carbohydrates' => .50, 'protein' => .15, 'fat' => .35]
            : ['carbohydrates' => .50, 'protein' => .20, 'fat' => .30];

        return array_merge([
            'calories' => round($calories, 1),
            'carbohydrates' => round($calories * $ratios['carbohydrates'] / 4, 1),
            'protein' => round($calories * $ratios['protein'] / 4, 1),
            'fat' => round($calories * $ratios['fat'] / 9, 1),
        ], $overrides);
    }
}

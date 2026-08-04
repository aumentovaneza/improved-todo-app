<?php

namespace App\Modules\MealPlanning\Services;

use App\Models\User;
use App\Modules\MealPlanning\Models\Household;
use App\Modules\MealPlanning\Models\HouseholdMember;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class HouseholdAccessService
{
    public function membership(Household $household, User $user): HouseholdMember
    {
        $member = $household->members()->where('user_id', $user->id)->first();
        if (! $member) {
            throw new AccessDeniedHttpException('You do not have access to this household.');
        }

        return $member;
    }

    public function ensureMember(Household $household, User $user): HouseholdMember
    {
        return $this->membership($household, $user);
    }

    public function ensureAdministrator(Household $household, User $user): HouseholdMember
    {
        $member = $this->membership($household, $user);
        if (! $member->canAdminister()) {
            throw new AccessDeniedHttpException('Household administrator access is required.');
        }

        return $member;
    }

    public function ensureDiaryAccess(HouseholdMember $subject, User $user): void
    {
        $actor = $this->membership($subject->household, $user);
        if (! $actor->canAdminister() && $subject->user_id !== $user->id) {
            throw new AccessDeniedHttpException('You may only manage your own diary.');
        }
    }
}

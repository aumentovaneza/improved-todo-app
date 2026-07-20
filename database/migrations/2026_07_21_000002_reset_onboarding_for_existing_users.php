<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * One-time rollout of the revamped onboarding to EXISTING users.
 *
 * The new welcome carousels (`welcome`, `wallet_welcome`) and the Getting
 * Started checklist (`checklist`) use brand-new tutorial keys, so existing
 * users see them automatically. But the *improved* spotlight tours reuse the
 * existing `onboarding` / `wallet_dashboard` keys — anyone who finished the old
 * tour has them marked complete and would never see the new version. Clearing
 * just those two keys lets the improved tours replay once, without disturbing
 * any per-page tour progress users have accumulated.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')
            ->whereNotNull('tutorial_progress')
            ->orderBy('id')
            ->chunkById(200, function ($users) {
                foreach ($users as $user) {
                    $progress = json_decode($user->tutorial_progress ?? '', true);
                    if (! is_array($progress)) {
                        continue;
                    }

                    unset($progress['onboarding'], $progress['wallet_dashboard']);

                    DB::table('users')
                        ->where('id', $user->id)
                        ->update([
                            'tutorial_progress' => empty($progress)
                                ? null
                                : json_encode($progress),
                        ]);
                }
            });
    }

    public function down(): void
    {
        // Irreversible: prior per-user onboarding state is not retained.
    }
};

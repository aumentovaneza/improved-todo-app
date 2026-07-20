<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        $userIds = DB::table('users')->pluck('id');

        $existing = DB::table('finance_accounts')
            ->where('is_default', true)
            ->pluck('user_id')
            ->all();
        $existing = array_flip($existing);

        $rows = [];
        foreach ($userIds as $userId) {
            if (isset($existing[$userId])) {
                continue;
            }

            $rows[] = [
                'user_id' => $userId,
                'name' => 'Cash on hand',
                'label' => 'Cash on hand',
                'type' => 'cash',
                'currency' => 'PHP',
                'starting_balance' => 0,
                'current_balance' => 0,
                'is_active' => 1,
                'is_default' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        if (! empty($rows)) {
            DB::table('finance_accounts')->insert($rows);
        }
    }

    public function down(): void
    {
        DB::table('finance_accounts')
            ->where('is_default', true)
            ->where('type', 'cash')
            ->delete();
    }
};

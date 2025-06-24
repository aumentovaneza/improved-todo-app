<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Fix any invalid user_id values by assigning them to the first user
        $firstUser = \App\Models\User::first();
        if ($firstUser) {
            // Update any categories with invalid user_id values
            DB::table('categories')
                ->whereNotIn('user_id', DB::table('users')->pluck('id'))
                ->update(['user_id' => $firstUser->id]);
        }

        // Add the foreign key constraint
        Schema::table('categories', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn('user_id');
        });
    }
};

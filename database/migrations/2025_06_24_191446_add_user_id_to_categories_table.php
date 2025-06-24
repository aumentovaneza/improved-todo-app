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
        // First, add the user_id column to the categories table
        Schema::table('categories', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->after('id');
        });

        // Fix any invalid user_id values by assigning them to the first user
        $firstUser = \App\Models\User::first();
        if ($firstUser) {
            // Update any categories with null or invalid user_id values
            DB::table('categories')
                ->whereNull('user_id')
                ->update(['user_id' => $firstUser->id]);

            // Update any categories with invalid user_id values
            DB::table('categories')
                ->whereNotIn('user_id', DB::table('users')->pluck('id'))
                ->update(['user_id' => $firstUser->id]);
        }

        // Make the user_id column not nullable and add the foreign key constraint
        Schema::table('categories', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable(false)->change();
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

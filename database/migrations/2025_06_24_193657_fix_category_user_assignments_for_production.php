<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * This migration handles the production scenario where categories are currently shared
     * and need to be properly assigned to users without breaking existing task associations.
     */
    public function up(): void
    {
        // Step 1: Find all users who have tasks with categories
        $usersWithCategorizedTasks = DB::table('tasks')
            ->join('categories', 'tasks.category_id', '=', 'categories.id')
            ->select('tasks.user_id', 'categories.id as category_id', 'categories.name', 'categories.color', 'categories.description', 'categories.is_active')
            ->distinct()
            ->get()
            ->groupBy('user_id');

        // Step 2: For each user, create their own copy of categories they're using
        foreach ($usersWithCategorizedTasks as $userId => $userCategories) {
            foreach ($userCategories as $categoryData) {
                // Check if user already has this category
                $existingCategory = DB::table('categories')
                    ->where('name', $categoryData->name)
                    ->where('user_id', $userId)
                    ->first();

                if (!$existingCategory) {
                    // Create a new category for this user
                    $newCategoryId = DB::table('categories')->insertGetId([
                        'name' => $categoryData->name,
                        'color' => $categoryData->color,
                        'description' => $categoryData->description,
                        'is_active' => $categoryData->is_active,
                        'user_id' => $userId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    // Update all tasks for this user that were using the old category
                    DB::table('tasks')
                        ->where('user_id', $userId)
                        ->where('category_id', $categoryData->category_id)
                        ->update(['category_id' => $newCategoryId]);

                    echo "Created category '{$categoryData->name}' for user {$userId} (new ID: {$newCategoryId})\n";
                } else {
                    // User already has this category, update tasks to use it
                    DB::table('tasks')
                        ->where('user_id', $userId)
                        ->where('category_id', $categoryData->category_id)
                        ->update(['category_id' => $existingCategory->id]);

                    echo "Updated tasks for user {$userId} to use existing category '{$categoryData->name}' (ID: {$existingCategory->id})\n";
                }
            }
        }

        // Step 3: Handle users who don't have any categorized tasks but might want basic categories
        $allUsers = DB::table('users')->pluck('id');
        $usersWithoutCategories = $allUsers->diff($usersWithCategorizedTasks->keys());

        foreach ($usersWithoutCategories as $userId) {
            // Create basic categories for users who don't have any
            $basicCategories = [
                ['name' => 'Work', 'color' => '#3B82F6', 'description' => 'Work-related tasks'],
                ['name' => 'Personal', 'color' => '#10B981', 'description' => 'Personal tasks and goals'],
            ];

            foreach ($basicCategories as $categoryData) {
                $existingCategory = DB::table('categories')
                    ->where('name', $categoryData['name'])
                    ->where('user_id', $userId)
                    ->first();

                if (!$existingCategory) {
                    DB::table('categories')->insert([
                        'name' => $categoryData['name'],
                        'color' => $categoryData['color'],
                        'description' => $categoryData['description'],
                        'is_active' => true,
                        'user_id' => $userId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    echo "Created basic category '{$categoryData['name']}' for user {$userId}\n";
                }
            }
        }

        // Step 4: Clean up orphaned categories (those not assigned to any user and not used by any tasks)
        $orphanedCategories = DB::table('categories')
            ->leftJoin('tasks', 'categories.id', '=', 'tasks.category_id')
            ->whereNull('tasks.id')
            ->where('categories.user_id', 1) // These are the old shared categories
            ->pluck('categories.id');

        if ($orphanedCategories->isNotEmpty()) {
            DB::table('categories')->whereIn('id', $orphanedCategories)->delete();
            echo "Cleaned up " . $orphanedCategories->count() . " orphaned categories\n";
        }

        echo "Category user assignment migration completed successfully!\n";
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This migration is not easily reversible as it involves data duplication
        // In a rollback scenario, you would need to manually restore the shared category structure
        echo "Warning: This migration is not easily reversible. Manual intervention may be required.\n";
    }
};

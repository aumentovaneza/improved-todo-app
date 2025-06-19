<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Category;
use App\Models\Task;
use App\Models\User;
use Carbon\Carbon;

class TodoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create categories
        $categories = [
            ['name' => 'Work', 'color' => '#3B82F6', 'description' => 'Work-related tasks'],
            ['name' => 'Personal', 'color' => '#10B981', 'description' => 'Personal tasks and goals'],
            ['name' => 'Health', 'color' => '#EF4444', 'description' => 'Health and fitness tasks'],
            ['name' => 'Learning', 'color' => '#8B5CF6', 'description' => 'Learning and education tasks'],
            ['name' => 'Home', 'color' => '#F59E0B', 'description' => 'Home and household tasks'],
        ];

        foreach ($categories as $categoryData) {
            Category::create($categoryData);
        }

        // Get the first user (or create one if none exists)
        $user = User::first();
        if (!$user) {
            $user = User::create([
                'name' => 'Demo User',
                'email' => 'demo@example.com',
                'password' => bcrypt('password'),
                'role' => 'admin',
            ]);
        }

        // Create sample tasks
        $tasks = [
            [
                'title' => 'Complete project proposal',
                'description' => 'Finish the quarterly project proposal for the new client',
                'category_id' => Category::where('name', 'Work')->first()->id,
                'priority' => 'high',
                'status' => 'in_progress',
                'due_date' => Carbon::today()->addDays(2),
            ],
            [
                'title' => 'Morning workout',
                'description' => '30-minute cardio and strength training',
                'category_id' => Category::where('name', 'Health')->first()->id,
                'priority' => 'medium',
                'status' => 'pending',
                'due_date' => Carbon::today(),
            ],
            [
                'title' => 'Learn React hooks',
                'description' => 'Study advanced React hooks and custom hooks',
                'category_id' => Category::where('name', 'Learning')->first()->id,
                'priority' => 'medium',
                'status' => 'pending',
                'due_date' => Carbon::today()->addDays(5),
            ],
            [
                'title' => 'Grocery shopping',
                'description' => 'Buy groceries for the week',
                'category_id' => Category::where('name', 'Home')->first()->id,
                'priority' => 'low',
                'status' => 'pending',
                'due_date' => Carbon::today()->addDays(1),
            ],
            [
                'title' => 'Call mom',
                'description' => 'Weekly check-in call with mom',
                'category_id' => Category::where('name', 'Personal')->first()->id,
                'priority' => 'medium',
                'status' => 'completed',
                'due_date' => Carbon::yesterday(),
                'completed_at' => Carbon::now()->subHours(2),
            ],
            [
                'title' => 'Review quarterly reports',
                'description' => 'Review and approve quarterly financial reports',
                'category_id' => Category::where('name', 'Work')->first()->id,
                'priority' => 'urgent',
                'status' => 'pending',
                'due_date' => Carbon::today()->subDays(1), // Overdue
            ],
            [
                'title' => 'Plan weekend trip',
                'description' => 'Research and plan the upcoming weekend getaway',
                'category_id' => Category::where('name', 'Personal')->first()->id,
                'priority' => 'low',
                'status' => 'pending',
                'due_date' => Carbon::today()->addDays(7),
            ],
            [
                'title' => 'Update portfolio',
                'description' => 'Add recent projects to personal portfolio',
                'category_id' => Category::where('name', 'Work')->first()->id,
                'priority' => 'medium',
                'status' => 'pending',
                'due_date' => Carbon::today()->addDays(3),
            ],
        ];

        foreach ($tasks as $taskData) {
            $taskData['user_id'] = $user->id;
            $taskData['position'] = Task::where('user_id', $user->id)->max('position') + 1;
            Task::create($taskData);
        }
    }
}

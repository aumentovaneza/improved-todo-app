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

        // Get users to assign tasks to
        $demoUser = User::where('email', 'demo@example.com')->first();
        $testUser = User::where('email', 'test@example.com')->first();
        $adminUser = User::where('email', 'admin@example.com')->first();

        // Create sample tasks for demo user
        if ($demoUser) {
            $this->createTasksForUser($demoUser);
        }

        // Create some tasks for test user
        if ($testUser) {
            $this->createTasksForUser($testUser, true); // fewer tasks
        }

        // Create admin tasks
        if ($adminUser) {
            $this->createAdminTasks($adminUser);
        }
    }

    private function createTasksForUser(User $user, bool $minimal = false)
    {
        // Regular non-recurring tasks
        $tasks = [
            [
                'title' => 'Complete project proposal',
                'description' => 'Finish the quarterly project proposal for the new client',
                'category_id' => Category::where('name', 'Work')->first()->id,
                'priority' => 'high',
                'status' => 'in_progress',
                'due_date' => Carbon::today()->addDays(2),
                'is_recurring' => false,
            ],
            [
                'title' => 'Grocery shopping',
                'description' => 'Buy groceries for the week',
                'category_id' => Category::where('name', 'Home')->first()->id,
                'priority' => 'low',
                'status' => 'pending',
                'due_date' => Carbon::today()->addDays(1),
                'is_recurring' => false,
            ],
            [
                'title' => 'Review quarterly reports',
                'description' => 'Review and approve quarterly financial reports',
                'category_id' => Category::where('name', 'Work')->first()->id,
                'priority' => 'urgent',
                'status' => 'pending',
                'due_date' => Carbon::today()->subDays(1), // Overdue
                'is_recurring' => false,
            ],
        ];

        // Recurring tasks
        $recurringTasks = [
            [
                'title' => 'Daily Morning Workout',
                'description' => '30-minute cardio and strength training every morning',
                'category_id' => Category::where('name', 'Health')->first()->id,
                'priority' => 'medium',
                'status' => 'pending',
                'is_recurring' => true,
                'recurrence_type' => 'daily',
                'recurring_until' => Carbon::today()->addMonths(3),
                'start_time' => '07:00',
                'end_time' => '07:30',
                'is_all_day' => false,
            ],
            [
                'title' => 'Weekly Team Meeting',
                'description' => 'Weekly standup meeting with the development team',
                'category_id' => Category::where('name', 'Work')->first()->id,
                'priority' => 'high',
                'status' => 'pending',
                'is_recurring' => true,
                'recurrence_type' => 'weekly',
                'recurring_until' => Carbon::today()->addMonths(6),
                'start_time' => '10:00',
                'end_time' => '11:00',
                'is_all_day' => false,
            ],
            [
                'title' => 'Monthly Budget Review',
                'description' => 'Review monthly expenses and budget planning',
                'category_id' => Category::where('name', 'Personal')->first()->id,
                'priority' => 'medium',
                'status' => 'pending',
                'is_recurring' => true,
                'recurrence_type' => 'monthly',
                'recurring_until' => Carbon::today()->addYear(),
                'is_all_day' => true,
            ],
            [
                'title' => 'Annual Health Checkup',
                'description' => 'Comprehensive annual health examination',
                'category_id' => Category::where('name', 'Health')->first()->id,
                'priority' => 'high',
                'status' => 'pending',
                'is_recurring' => true,
                'recurrence_type' => 'yearly',
                'recurring_until' => Carbon::today()->addYears(5),
                'is_all_day' => true,
            ],
        ];

        if (!$minimal) {
            // Add more tasks for full demo
            $tasks = array_merge($tasks, [
                [
                    'title' => 'Learn React hooks',
                    'description' => 'Study advanced React hooks and custom hooks',
                    'category_id' => Category::where('name', 'Learning')->first()->id,
                    'priority' => 'medium',
                    'status' => 'pending',
                    'due_date' => Carbon::today()->addDays(5),
                    'is_recurring' => false,
                ],
                [
                    'title' => 'Call mom',
                    'description' => 'Weekly check-in call with mom',
                    'category_id' => Category::where('name', 'Personal')->first()->id,
                    'priority' => 'medium',
                    'status' => 'completed',
                    'due_date' => Carbon::yesterday(),
                    'completed_at' => Carbon::now()->subHours(2),
                    'is_recurring' => false,
                ],
                [
                    'title' => 'Plan weekend trip',
                    'description' => 'Research and plan the upcoming weekend getaway',
                    'category_id' => Category::where('name', 'Personal')->first()->id,
                    'priority' => 'low',
                    'status' => 'pending',
                    'due_date' => Carbon::today()->addDays(7),
                    'is_recurring' => false,
                ],
                [
                    'title' => 'Update portfolio',
                    'description' => 'Add recent projects to personal portfolio',
                    'category_id' => Category::where('name', 'Work')->first()->id,
                    'priority' => 'medium',
                    'status' => 'pending',
                    'due_date' => Carbon::today()->addDays(3),
                    'is_recurring' => false,
                ],
            ]);
        }

        // Create all tasks
        $allTasks = $minimal ? $tasks : array_merge($tasks, $recurringTasks);

        foreach ($allTasks as $taskData) {
            $taskData['user_id'] = $user->id;
            $taskData['position'] = Task::where('user_id', $user->id)->max('position') + 1;
            Task::create($taskData);
        }
    }

    private function createAdminTasks(User $adminUser)
    {
        $adminTasks = [
            [
                'title' => 'System Maintenance',
                'description' => 'Perform routine system maintenance and updates',
                'category_id' => Category::where('name', 'Work')->first()->id,
                'priority' => 'high',
                'status' => 'pending',
                'due_date' => Carbon::today()->addDays(1),
                'is_recurring' => false,
            ],
            [
                'title' => 'User Access Review',
                'description' => 'Review user permissions and access levels',
                'category_id' => Category::where('name', 'Work')->first()->id,
                'priority' => 'medium',
                'status' => 'pending',
                'due_date' => Carbon::today()->addDays(3),
                'is_recurring' => false,
            ],
            [
                'title' => 'Weekly Server Backup',
                'description' => 'Automated weekly server backup verification',
                'category_id' => Category::where('name', 'Work')->first()->id,
                'priority' => 'high',
                'status' => 'pending',
                'is_recurring' => true,
                'recurrence_type' => 'weekly',
                'recurring_until' => Carbon::today()->addYear(),
                'start_time' => '02:00',
                'end_time' => '03:00',
                'is_all_day' => false,
            ],
            [
                'title' => 'Monthly Security Audit',
                'description' => 'Comprehensive security audit and vulnerability assessment',
                'category_id' => Category::where('name', 'Work')->first()->id,
                'priority' => 'urgent',
                'status' => 'pending',
                'is_recurring' => true,
                'recurrence_type' => 'monthly',
                'recurring_until' => Carbon::today()->addYear(),
                'is_all_day' => true,
            ],
        ];

        foreach ($adminTasks as $taskData) {
            $taskData['user_id'] = $adminUser->id;
            $taskData['position'] = Task::where('user_id', $adminUser->id)->max('position') + 1;
            Task::create($taskData);
        }
    }
}

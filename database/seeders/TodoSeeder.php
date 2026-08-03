<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\ListItem;
use App\Models\Task;
use App\Models\TaskList;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class TodoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get users to assign tasks to
        $demoUser = User::where('email', 'demo@example.com')->first();
        $testUser = User::where('email', 'test@example.com')->first();
        $adminUser = User::where('email', 'admin@example.com')->first();

        // Create categories for each user and their tasks
        if ($demoUser) {
            $this->createCategoriesForUser($demoUser);
            $this->createTasksForUser($demoUser);
            $this->createTaskListsForUser($demoUser);
        }

        if ($testUser) {
            $this->createCategoriesForUser($testUser);
            $this->createTasksForUser($testUser, true); // fewer tasks
            $this->createTaskListsForUser($testUser);
        }

        if ($adminUser) {
            $this->createCategoriesForUser($adminUser);
            $this->createAdminTasks($adminUser);
            $this->createTaskListsForUser($adminUser);
        }
    }

    private function createCategoriesForUser(User $user)
    {
        $categories = [
            ['name' => 'Work', 'color' => '#3B82F6', 'description' => 'Work-related tasks'],
            ['name' => 'Personal', 'color' => '#10B981', 'description' => 'Personal tasks and goals'],
            ['name' => 'Health', 'color' => '#EF4444', 'description' => 'Health and fitness tasks'],
            ['name' => 'Learning', 'color' => '#8B5CF6', 'description' => 'Learning and education tasks'],
            ['name' => 'Home', 'color' => '#F59E0B', 'description' => 'Home and household tasks'],
        ];

        foreach ($categories as $categoryData) {
            $categoryData['user_id'] = $user->id;
            Category::create($categoryData);
        }
    }

    private function createTasksForUser(User $user, bool $minimal = false)
    {
        // Get user's categories
        $workCategory = Category::where('name', 'Work')->where('user_id', $user->id)->first();
        $personalCategory = Category::where('name', 'Personal')->where('user_id', $user->id)->first();
        $healthCategory = Category::where('name', 'Health')->where('user_id', $user->id)->first();
        $learningCategory = Category::where('name', 'Learning')->where('user_id', $user->id)->first();
        $homeCategory = Category::where('name', 'Home')->where('user_id', $user->id)->first();

        // Regular non-recurring tasks
        $tasks = [
            [
                'title' => 'Complete project proposal',
                'description' => 'Finish the quarterly project proposal for the new client',
                'category_id' => $workCategory->id,
                'priority' => 'high',
                'status' => 'in_progress',
                'due_date' => Carbon::today()->addDays(2),
                'is_recurring' => false,
            ],
            [
                'title' => 'Grocery shopping',
                'description' => 'Buy groceries for the week',
                'category_id' => $homeCategory->id,
                'priority' => 'low',
                'status' => 'pending',
                'due_date' => Carbon::today()->addDays(1),
                'is_recurring' => false,
            ],
            [
                'title' => 'Review quarterly reports',
                'description' => 'Review and approve quarterly financial reports',
                'category_id' => $workCategory->id,
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
                'category_id' => $healthCategory->id,
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
                'category_id' => $workCategory->id,
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
                'category_id' => $personalCategory->id,
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
                'category_id' => $healthCategory->id,
                'priority' => 'high',
                'status' => 'pending',
                'is_recurring' => true,
                'recurrence_type' => 'yearly',
                'recurring_until' => Carbon::today()->addYears(5),
                'is_all_day' => true,
            ],
        ];

        if (! $minimal) {
            // Add more tasks for full demo
            $tasks = array_merge($tasks, [
                [
                    'title' => 'Learn React hooks',
                    'description' => 'Study advanced React hooks and custom hooks',
                    'category_id' => $learningCategory->id,
                    'priority' => 'medium',
                    'status' => 'pending',
                    'due_date' => Carbon::today()->addDays(5),
                    'is_recurring' => false,
                ],
                [
                    'title' => 'Call mom',
                    'description' => 'Weekly check-in call with mom',
                    'category_id' => $personalCategory->id,
                    'priority' => 'medium',
                    'status' => 'completed',
                    'due_date' => Carbon::yesterday(),
                    'completed_at' => Carbon::now()->subHours(2),
                    'is_recurring' => false,
                ],
                [
                    'title' => 'Plan weekend trip',
                    'description' => 'Research and plan the upcoming weekend getaway',
                    'category_id' => $personalCategory->id,
                    'priority' => 'low',
                    'status' => 'pending',
                    'due_date' => Carbon::today()->addDays(7),
                    'is_recurring' => false,
                ],
                [
                    'title' => 'Update portfolio',
                    'description' => 'Add recent projects to personal portfolio',
                    'category_id' => $workCategory->id,
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

    private function createTaskListsForUser(User $user)
    {
        $lists = [
            [
                'name' => 'Grocery List',
                'color' => '#10B981',
                'description' => 'Weekly groceries to pick up',
                'items' => ['Milk', 'Eggs', 'Bread', 'Coffee', 'Bananas'],
            ],
            [
                'name' => 'Packing List',
                'color' => '#3B82F6',
                'description' => 'Essentials for the next trip',
                'items' => ['Passport', 'Charger', 'Toothbrush', 'Headphones'],
            ],
            [
                'name' => 'Weekend Errands',
                'color' => '#F59E0B',
                'description' => 'Things to get done this weekend',
                'items' => ['Car wash', 'Post office', 'Return library books'],
            ],
        ];

        foreach ($lists as $index => $listData) {
            $list = TaskList::create([
                'user_id' => $user->id,
                'is_sample' => true,
                'name' => $listData['name'],
                'color' => $listData['color'],
                'description' => $listData['description'],
                'position' => $index + 1,
            ]);

            foreach ($listData['items'] as $itemIndex => $content) {
                ListItem::create([
                    'task_list_id' => $list->id,
                    'content' => $content,
                    'is_completed' => false,
                    'position' => $itemIndex + 1,
                ]);
            }
        }

        // Attach the first list to one of the user's existing sample tasks so the
        // task <-> list relationship shows something real out of the box.
        $firstList = TaskList::where('user_id', $user->id)->orderBy('position')->first();
        $firstTask = Task::where('user_id', $user->id)->orderBy('position')->first();

        if ($firstList && $firstTask) {
            $firstList->tasks()->attach($firstTask->id);
        }
    }

    private function createAdminTasks(User $adminUser)
    {
        // Get admin user's work category
        $workCategory = Category::where('name', 'Work')->where('user_id', $adminUser->id)->first();

        $adminTasks = [
            [
                'title' => 'System Maintenance',
                'description' => 'Perform routine system maintenance and updates',
                'category_id' => $workCategory->id,
                'priority' => 'high',
                'status' => 'pending',
                'due_date' => Carbon::today()->addDays(1),
                'is_recurring' => false,
            ],
            [
                'title' => 'User Access Review',
                'description' => 'Review user permissions and access levels',
                'category_id' => $workCategory->id,
                'priority' => 'medium',
                'status' => 'pending',
                'due_date' => Carbon::today()->addDays(3),
                'is_recurring' => false,
            ],
            [
                'title' => 'Weekly Server Backup',
                'description' => 'Automated weekly server backup verification',
                'category_id' => $workCategory->id,
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
                'category_id' => $workCategory->id,
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

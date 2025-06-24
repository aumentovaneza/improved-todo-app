<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Category;
use App\Models\Task;
use App\Models\Tag;
use App\Models\Subtask;
use App\Models\Reminder;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;

class ProductionShowcaseSeeder extends Seeder
{
    /**
     * Run the database seeds for production showcase.
     * Creates a user with comprehensive data to demonstrate all app features.
     */
    public function run(): void
    {
        // Create showcase user (not admin)
        $showcaseUser = User::create([
            'name' => 'Sarah Johnson',
            'email' => 'showcase@todoapp.com',
            'password' => Hash::make('showcase2024'),
            'role' => 'member',
            'timezone' => 'America/New_York',
            'news_category' => 'technology',
            'email_verified_at' => now(),
        ]);

        // Create comprehensive categories if they don't exist
        $this->createCategories();

        // Create comprehensive tags if they don't exist
        $this->createTags();

        // Create showcase tasks with various features
        $this->createShowcaseTasks($showcaseUser);

        $this->command->info('Production showcase user created successfully!');
        $this->command->info('Email: showcase@todoapp.com');
        $this->command->info('Password: showcase2024');
    }

    private function createCategories()
    {
        $categories = [
            ['name' => 'Work', 'color' => '#3B82F6', 'description' => 'Professional tasks and projects'],
            ['name' => 'Personal', 'color' => '#10B981', 'description' => 'Personal goals and activities'],
            ['name' => 'Health & Fitness', 'color' => '#EF4444', 'description' => 'Health, fitness, and wellness tasks'],
            ['name' => 'Learning', 'color' => '#8B5CF6', 'description' => 'Education and skill development'],
            ['name' => 'Home & Family', 'color' => '#F59E0B', 'description' => 'Household and family-related tasks'],
            ['name' => 'Finance', 'color' => '#06B6D4', 'description' => 'Financial planning and management'],
            ['name' => 'Creative', 'color' => '#EC4899', 'description' => 'Creative projects and hobbies'],
            ['name' => 'Travel', 'color' => '#84CC16', 'description' => 'Travel planning and activities'],
        ];

        foreach ($categories as $categoryData) {
            Category::firstOrCreate(
                ['name' => $categoryData['name']],
                $categoryData
            );
        }
    }

    private function createTags()
    {
        $tags = [
            ['name' => 'urgent', 'color' => '#EF4444', 'description' => 'Urgent tasks requiring immediate attention'],
            ['name' => 'important', 'color' => '#F59E0B', 'description' => 'Important tasks with high priority'],
            ['name' => 'meeting', 'color' => '#3B82F6', 'description' => 'Meeting-related tasks'],
            ['name' => 'research', 'color' => '#8B5CF6', 'description' => 'Research and analysis tasks'],
            ['name' => 'creative', 'color' => '#EC4899', 'description' => 'Creative and design tasks'],
            ['name' => 'planning', 'color' => '#06B6D4', 'description' => 'Planning and strategy tasks'],
            ['name' => 'review', 'color' => '#F97316', 'description' => 'Review and evaluation tasks'],
            ['name' => 'collaboration', 'color' => '#10B981', 'description' => 'Team collaboration tasks'],
            ['name' => 'learning', 'color' => '#7C3AED', 'description' => 'Learning and development tasks'],
            ['name' => 'maintenance', 'color' => '#6B7280', 'description' => 'Maintenance and upkeep tasks'],
        ];

        foreach ($tags as $tagData) {
            Tag::firstOrCreate(
                ['name' => $tagData['name']],
                $tagData
            );
        }
    }

    private function createShowcaseTasks(User $user)
    {
        $workCategory = Category::where('name', 'Work')->first();
        $personalCategory = Category::where('name', 'Personal')->first();
        $healthCategory = Category::where('name', 'Health & Fitness')->first();
        $learningCategory = Category::where('name', 'Learning')->first();
        $homeCategory = Category::where('name', 'Home & Family')->first();
        $financeCategory = Category::where('name', 'Finance')->first();
        $creativeCategory = Category::where('name', 'Creative')->first();
        $travelCategory = Category::where('name', 'Travel')->first();

        // Get tags for assignment
        $urgentTag = Tag::where('name', 'urgent')->first();
        $importantTag = Tag::where('name', 'important')->first();
        $meetingTag = Tag::where('name', 'meeting')->first();
        $researchTag = Tag::where('name', 'research')->first();
        $creativeTag = Tag::where('name', 'creative')->first();
        $planningTag = Tag::where('name', 'planning')->first();
        $reviewTag = Tag::where('name', 'review')->first();
        $collaborationTag = Tag::where('name', 'collaboration')->first();
        $learningTag = Tag::where('name', 'learning')->first();
        $maintenanceTag = Tag::where('name', 'maintenance')->first();

        // Create diverse tasks showcasing different features
        $tasks = [
            // Overdue urgent task
            [
                'title' => 'Submit Q4 Financial Report',
                'description' => 'Complete and submit the quarterly financial report to the board. Include revenue analysis, expense breakdown, and future projections.',
                'category_id' => $workCategory->id,
                'priority' => 'urgent',
                'status' => 'in_progress',
                'due_date' => Carbon::now()->subDays(2),
                'start_time' => '09:00',
                'end_time' => '17:00',
                'is_all_day' => false,
                'tags' => [$urgentTag, $reviewTag],
                'subtasks' => [
                    'Gather financial data from all departments',
                    'Analyze revenue trends and patterns',
                    'Create executive summary',
                    'Review with finance team',
                    'Submit to board portal'
                ],
                'reminders' => [
                    ['type' => 'email', 'minutes_before' => 60],
                    ['type' => 'notification', 'minutes_before' => 30],
                ]
            ],

            // Today's important meeting
            [
                'title' => 'Product Strategy Meeting',
                'description' => 'Weekly product strategy meeting with the development team to discuss roadmap priorities and upcoming features.',
                'category_id' => $workCategory->id,
                'priority' => 'high',
                'status' => 'pending',
                'due_date' => Carbon::today(),
                'start_time' => '14:00',
                'end_time' => '15:30',
                'is_all_day' => false,
                'tags' => [$meetingTag, $planningTag, $collaborationTag],
                'subtasks' => [
                    'Review last week\'s progress',
                    'Discuss upcoming sprint goals',
                    'Prioritize feature requests',
                    'Assign action items'
                ],
                'reminders' => [
                    ['type' => 'notification', 'minutes_before' => 15],
                ]
            ],

            // Tomorrow's creative task
            [
                'title' => 'Design New Marketing Campaign',
                'description' => 'Create visual concepts and copy for the upcoming spring marketing campaign. Focus on brand consistency and target audience engagement.',
                'category_id' => $creativeCategory->id,
                'priority' => 'high',
                'status' => 'pending',
                'due_date' => Carbon::tomorrow(),
                'start_time' => '10:00',
                'end_time' => '16:00',
                'is_all_day' => false,
                'tags' => [$creativeTag, $planningTag, $importantTag],
                'subtasks' => [
                    'Research competitor campaigns',
                    'Create mood board',
                    'Design initial concepts',
                    'Write campaign copy',
                    'Present to marketing team'
                ],
                'reminders' => [
                    ['type' => 'email', 'minutes_before' => 120],
                ]
            ],

            // Completed task
            [
                'title' => 'Complete Online Course: Advanced React',
                'description' => 'Finish the advanced React course including all assignments and final project.',
                'category_id' => $learningCategory->id,
                'priority' => 'medium',
                'status' => 'completed',
                'due_date' => Carbon::yesterday(),
                'completed_at' => Carbon::yesterday()->setTime(18, 30),
                'is_all_day' => true,
                'tags' => [$learningTag],
                'subtasks' => [
                    'Complete modules 1-5',
                    'Submit practice assignments',
                    'Build final project',
                    'Take final assessment'
                ]
            ],

            // Future personal task
            [
                'title' => 'Plan Anniversary Dinner',
                'description' => 'Research and book a special restaurant for our 5th wedding anniversary. Make reservations and plan the evening.',
                'category_id' => $personalCategory->id,
                'priority' => 'medium',
                'status' => 'pending',
                'due_date' => Carbon::now()->addDays(5),
                'is_all_day' => true,
                'tags' => [$planningTag],
                'subtasks' => [
                    'Research romantic restaurants',
                    'Check availability and make reservation',
                    'Plan transportation',
                    'Arrange childcare if needed'
                ]
            ],

            // Recurring daily task
            [
                'title' => 'Morning Meditation',
                'description' => 'Daily 15-minute mindfulness meditation to start the day with clarity and focus.',
                'category_id' => $healthCategory->id,
                'priority' => 'medium',
                'status' => 'pending',
                'due_date' => Carbon::today(),
                'start_time' => '06:30',
                'end_time' => '06:45',
                'is_all_day' => false,
                'is_recurring' => true,
                'recurrence_type' => 'daily',
                'recurring_until' => Carbon::now()->addMonths(6),
                'tags' => [$maintenanceTag],
            ],

            // Recurring weekly task
            [
                'title' => 'Team Standup Meeting',
                'description' => 'Weekly team standup to sync on progress, blockers, and upcoming priorities.',
                'category_id' => $workCategory->id,
                'priority' => 'high',
                'status' => 'pending',
                'due_date' => Carbon::now()->next('Monday'),
                'start_time' => '09:00',
                'end_time' => '09:30',
                'is_all_day' => false,
                'is_recurring' => true,
                'recurrence_type' => 'weekly',
                'recurring_until' => Carbon::now()->addMonths(12),
                'tags' => [$meetingTag, $collaborationTag],
            ],

            // Recurring monthly task
            [
                'title' => 'Monthly Budget Review',
                'description' => 'Review monthly expenses, update budget categories, and plan for upcoming financial goals.',
                'category_id' => $financeCategory->id,
                'priority' => 'medium',
                'status' => 'pending',
                'due_date' => Carbon::now()->endOfMonth(),
                'is_all_day' => true,
                'is_recurring' => true,
                'recurrence_type' => 'monthly',
                'recurring_until' => Carbon::now()->addYear(),
                'tags' => [$reviewTag, $planningTag],
                'subtasks' => [
                    'Categorize all expenses',
                    'Compare against budget',
                    'Identify areas for improvement',
                    'Update savings goals'
                ]
            ],

            // Long-term project
            [
                'title' => 'Home Office Renovation',
                'description' => 'Complete renovation of the home office space including new furniture, lighting, and organization systems.',
                'category_id' => $homeCategory->id,
                'priority' => 'low',
                'status' => 'pending',
                'due_date' => Carbon::now()->addMonths(2),
                'is_all_day' => true,
                'tags' => [$planningTag, $creativeTag],
                'subtasks' => [
                    'Measure space and create floor plan',
                    'Research furniture options',
                    'Choose color scheme and lighting',
                    'Order furniture and supplies',
                    'Schedule installation',
                    'Organize and decorate'
                ]
            ],

            // Travel planning task
            [
                'title' => 'Plan Summer Vacation',
                'description' => 'Research and plan the family summer vacation including destinations, accommodations, and activities.',
                'category_id' => $travelCategory->id,
                'priority' => 'medium',
                'status' => 'in_progress',
                'due_date' => Carbon::now()->addWeeks(3),
                'is_all_day' => true,
                'tags' => [$planningTag, $researchTag],
                'subtasks' => [
                    'Research destinations',
                    'Compare flight prices',
                    'Book accommodations',
                    'Plan daily activities',
                    'Arrange pet care',
                    'Create packing list'
                ],
                'reminders' => [
                    ['type' => 'email', 'minutes_before' => 1440], // 1 day before
                ]
            ]
        ];

        $position = 1;
        foreach ($tasks as $taskData) {
            // Extract subtasks and reminders
            $subtasks = $taskData['subtasks'] ?? [];
            $reminders = $taskData['reminders'] ?? [];
            $tags = $taskData['tags'] ?? [];

            unset($taskData['subtasks'], $taskData['reminders'], $taskData['tags']);

            // Create the task
            $taskData['user_id'] = $user->id;
            $taskData['position'] = $position++;
            $task = Task::create($taskData);

            // Attach tags
            if (!empty($tags)) {
                $task->tags()->attach(collect($tags)->pluck('id'));
            }

            // Create subtasks
            foreach ($subtasks as $index => $subtaskTitle) {
                $subtaskData = [
                    'task_id' => $task->id,
                    'title' => $subtaskTitle,
                    'position' => $index + 1,
                    'is_completed' => false,
                ];

                // Mark some subtasks as completed for completed tasks
                if ($task->status === 'completed') {
                    $subtaskData['is_completed'] = true;
                    $subtaskData['completed_at'] = $task->completed_at;
                } elseif ($task->status === 'in_progress' && $index < 2) {
                    // Mark first couple subtasks as completed for in-progress tasks
                    $subtaskData['is_completed'] = true;
                    $subtaskData['completed_at'] = Carbon::now()->subHours(rand(1, 48));
                }

                Subtask::create($subtaskData);
            }

            // Create reminders
            foreach ($reminders as $reminderData) {
                $reminderTime = $task->due_date->copy();

                if ($task->start_time) {
                    $reminderTime = $reminderTime->setTimeFromTimeString($task->start_time);
                }

                $reminderTime->subMinutes($reminderData['minutes_before']);

                Reminder::create([
                    'task_id' => $task->id,
                    'user_id' => $user->id,
                    'reminder_time' => $reminderTime,
                    'type' => $reminderData['type'],
                    'is_sent' => $reminderTime->isPast(),
                    'sent_at' => $reminderTime->isPast() ? $reminderTime : null,
                ]);
            }
        }
    }
}

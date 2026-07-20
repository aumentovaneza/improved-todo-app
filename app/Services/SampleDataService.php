<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Task;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Seeds a small, clearly-marked starter dataset for brand-new users so their
 * first visit to the dashboard, calendar, and analytics shows something real
 * to explore instead of an empty screen. Everything is flagged `is_sample` so
 * it can be cleared in one click.
 *
 * Finance data is intentionally NOT seeded — fake transactions would distort
 * WevieWallet balances, net cash flow, and analytics. The finance side relies
 * on empty-states and the Getting Started checklist instead.
 */
class SampleDataService
{
    public function seedFor(User $user): void
    {
        // Guard against double-seeding (e.g. re-run of a registration flow).
        if (Task::where('user_id', $user->id)->where('is_sample', true)->exists()) {
            return;
        }

        DB::transaction(function () use ($user) {
            $categories = $this->createCategories($user);
            $this->createTasks($user, $categories);
        });
    }

    /**
     * Remove all sample content for a user. Returns the number of tasks +
     * categories deleted.
     */
    public function clearFor(User $user): int
    {
        $tasks = Task::where('user_id', $user->id)->where('is_sample', true)->delete();
        $categories = Category::where('user_id', $user->id)->where('is_sample', true)->delete();

        return $tasks + $categories;
    }

    /** @return array<string, Category> keyed by name */
    private function createCategories(User $user): array
    {
        $definitions = [
            ['name' => 'Work', 'color' => '#3B82F6', 'description' => 'Work-related tasks'],
            ['name' => 'Personal', 'color' => '#10B981', 'description' => 'Personal goals and errands'],
            ['name' => 'Health', 'color' => '#EF4444', 'description' => 'Health and fitness'],
        ];

        $created = [];
        foreach ($definitions as $data) {
            $created[$data['name']] = Category::create([
                'user_id' => $user->id,
                'is_sample' => true,
                'name' => $data['name'],
                'color' => $data['color'],
                'description' => $data['description'],
                'is_active' => true,
            ]);
        }

        return $created;
    }

    /** @param array<string, Category> $categories */
    private function createTasks(User $user, array $categories): void
    {
        $tasks = [
            [
                'title' => '👋 Welcome! Click me to see a task',
                'description' => 'This is a sample task. Open it to explore subtasks, tags, reminders, and more. Clear all samples anytime from the banner above.',
                'category_id' => $categories['Personal']->id,
                'priority' => 'high',
                'status' => 'pending',
                'due_date' => Carbon::today(),
                'is_recurring' => false,
            ],
            [
                'title' => 'Plan my week',
                'description' => 'Try dragging this into a workspace board, or open the Calendar to see it in context.',
                'category_id' => $categories['Work']->id,
                'priority' => 'medium',
                'status' => 'pending',
                'due_date' => Carbon::today()->addDays(2),
                'is_recurring' => false,
            ],
            [
                'title' => 'Morning walk',
                'description' => 'A sample recurring task — complete it and Wevie schedules the next one automatically.',
                'category_id' => $categories['Health']->id,
                'priority' => 'medium',
                'status' => 'pending',
                'is_recurring' => true,
                'recurrence_type' => 'daily',
                'recurring_until' => Carbon::today()->addMonth(),
                'start_time' => '07:00',
                'end_time' => '07:30',
                'is_all_day' => false,
            ],
            [
                'title' => 'Set up my first real task',
                'description' => 'When you are ready, add your own tasks — then clear these samples.',
                'category_id' => $categories['Personal']->id,
                'priority' => 'low',
                'status' => 'completed',
                'due_date' => Carbon::yesterday(),
                'completed_at' => Carbon::now()->subHour(),
                'is_recurring' => false,
            ],
        ];

        foreach ($tasks as $data) {
            $data['user_id'] = $user->id;
            $data['is_sample'] = true;
            $data['position'] = Task::where('user_id', $user->id)->max('position') + 1;
            Task::create($data);
        }
    }
}

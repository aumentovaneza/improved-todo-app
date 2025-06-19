<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Tag;

class TagSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tags = [
            ['name' => 'urgent', 'color' => '#EF4444', 'description' => 'Urgent tasks that need immediate attention'],
            ['name' => 'work', 'color' => '#3B82F6', 'description' => 'Work-related tasks'],
            ['name' => 'personal', 'color' => '#10B981', 'description' => 'Personal tasks and activities'],
            ['name' => 'meeting', 'color' => '#F59E0B', 'description' => 'Meeting-related tasks'],
            ['name' => 'research', 'color' => '#8B5CF6', 'description' => 'Research and learning tasks'],
            ['name' => 'review', 'color' => '#F97316', 'description' => 'Review and feedback tasks'],
            ['name' => 'bug', 'color' => '#EF4444', 'description' => 'Bug fixes and technical issues'],
            ['name' => 'feature', 'color' => '#06B6D4', 'description' => 'New feature development'],
            ['name' => 'documentation', 'color' => '#84CC16', 'description' => 'Documentation tasks'],
            ['name' => 'planning', 'color' => '#EC4899', 'description' => 'Planning and strategy tasks'],
        ];

        foreach ($tags as $tag) {
            Tag::firstOrCreate(
                ['name' => $tag['name']],
                $tag
            );
        }
    }
}

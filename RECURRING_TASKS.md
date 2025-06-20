# Recurring Tasks Auto-Reset Feature

## Overview

This application includes an automatic reset feature for recurring tasks. When a recurring task is marked as completed, it will automatically reset to "pending" status on the next occurrence date based on its recurrence pattern.

## How It Works

### 1. Automatic Daily Reset

-   A scheduled command runs daily at midnight
-   The command checks all completed recurring tasks
-   Tasks that should recur based on their pattern are reset to "pending" status
-   The due date is updated to the next occurrence date
-   All subtasks are also reset to incomplete

### 2. Recurrence Patterns Supported

-   **Daily**: Task resets every day
-   **Weekly**: Task resets every week (same day of week)
-   **Monthly**: Task resets every month (same day of month)
-   **Yearly**: Task resets every year (same date)

### 3. Timezone Support

-   The reset considers each user's timezone
-   Tasks reset at midnight in the user's local timezone
-   This ensures tasks reset at the appropriate time for each user

## Technical Implementation

### Commands

-   `tasks:reset-recurring` - Main command that resets completed recurring tasks
-   `tasks:test-recurring-reset` - Test command to verify functionality

### Scheduling

The reset command is scheduled to run daily in `routes/console.php`:

```php
Schedule::command('tasks:reset-recurring')
    ->daily()
    ->description('Reset completed recurring tasks for the next occurrence');
```

### Database Fields

Recurring tasks use these fields:

-   `is_recurring` - Boolean flag indicating if task is recurring
-   `recurrence_type` - Type of recurrence (daily, weekly, monthly, yearly)
-   `recurrence_config` - JSON configuration for complex patterns (future use)
-   `recurring_until` - End date for the recurrence pattern

## Usage

### Creating a Recurring Task

When creating a task, set:

1. `is_recurring` to `true`
2. `recurrence_type` to one of: daily, weekly, monthly, yearly
3. `recurring_until` to the date when recurrence should stop

### What Happens When Completed

1. User marks the recurring task as completed
2. Task status changes to "completed" and `completed_at` is set
3. At midnight (user's timezone), the scheduled command runs
4. If it's time for the next occurrence, the task is reset:
    - Status changes back to "pending"
    - `completed_at` is cleared
    - `due_date` is updated to next occurrence
    - All subtasks are reset to incomplete

### Manual Testing

You can test the functionality using:

```bash
php artisan tasks:test-recurring-reset
```

This command will:

1. Create a test recurring task
2. Mark it as completed yesterday
3. Run the reset command
4. Show the results
5. Optionally clean up the test data

## Production Setup

### Cron Job Setup

For production, add this cron job to run the Laravel scheduler:

```bash
* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
```

### Manual Execution

You can also run the reset command manually:

```bash
php artisan tasks:reset-recurring
```

## Example Scenarios

### Daily Task

-   Task created: "Take vitamins" (daily recurring)
-   User completes it on Monday
-   Tuesday at midnight: Task resets to pending with Tuesday's date

### Weekly Task

-   Task created: "Weekly team meeting" (weekly recurring, Fridays)
-   User completes it on Friday
-   Next Friday at midnight: Task resets to pending

### Monthly Task

-   Task created: "Pay rent" (monthly recurring, 1st of month)
-   User completes it on January 1st
-   February 1st at midnight: Task resets to pending

## Notes

-   Tasks only reset if they haven't exceeded their `recurring_until` date
-   **Special case**: Tasks can reset even on the final day of their recurrence period (if `recurring_until` is today)
-   If a user misses multiple occurrences, the task will reset to the current date
-   Subtasks are automatically reset when the parent task resets
-   The system respects user timezones for accurate reset timing
-   Date comparisons use date strings to avoid timezone-related issues

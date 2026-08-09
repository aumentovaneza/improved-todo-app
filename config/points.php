<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Award amounts
    |--------------------------------------------------------------------------
    |
    | Point values granted per productive action. These are the ONLY source of
    | award amounts — client-supplied values are always ignored.
    |
    */

    'award' => [
        'task_completion' => (int) env('POINTS_TASK_COMPLETION', 10),
        'subtask_completion' => (int) env('POINTS_SUBTASK_COMPLETION', 2),
        'daily_streak' => (int) env('POINTS_DAILY_STREAK', 5),
        'pomodoro_session' => (int) env('POINTS_POMODORO_SESSION', 8),
    ],

    /*
    |--------------------------------------------------------------------------
    | Streak rules
    |--------------------------------------------------------------------------
    |
    | Phase 1 credits a flat `award.daily_streak` bonus once per active day.
    | These knobs back a Phase 2 escalating bonus and are defined up front so
    | no config rewrite is needed later.
    |
    */

    'streak' => [
        'bonus_per_day' => (int) env('POINTS_STREAK_BONUS_PER_DAY', 1),
        'max_bonus' => (int) env('POINTS_STREAK_MAX_BONUS', 20),
    ],

    /*
    |--------------------------------------------------------------------------
    | Pomodoro rules
    |--------------------------------------------------------------------------
    |
    | Server-side validation window for awarding focus sessions. Only the
    | listed session types earn, and only within the duration bounds and under
    | the per-day cap.
    |
    */

    'pomodoro' => [
        'min_seconds' => (int) env('POINTS_POMODORO_MIN_SECONDS', 900),
        'max_seconds' => (int) env('POINTS_POMODORO_MAX_SECONDS', 7200),
        'daily_award_cap' => (int) env('POINTS_POMODORO_DAILY_CAP', 16),
        'awardable_types' => ['work'],
    ],

];

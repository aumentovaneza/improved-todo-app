<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default AI Provider
    |--------------------------------------------------------------------------
    |
    | The text-generation provider used for features such as the AI daily
    | summary. Supported: "anthropic", "openai", "gemini". Each provider is
    | called over HTTP (via the Http facade) so no vendor SDK is required.
    |
    */

    'default' => env('AI_PROVIDER', 'anthropic'),

    /*
    |--------------------------------------------------------------------------
    | Daily Summary Open Beta
    |--------------------------------------------------------------------------
    |
    | The AI daily summary is a "pro" feature, but during the open beta every
    | user is entitled to it. Flip this to false (and implement the real tier
    | check in DailySummaryService::userCanUseSummary) once a paid plan exists.
    |
    */

    'daily_summary_open_beta' => env('AI_DAILY_SUMMARY_OPEN_BETA', true),

    /*
    |--------------------------------------------------------------------------
    | Providers
    |--------------------------------------------------------------------------
    |
    | Per-provider credentials and default model. Keys are read from the
    | environment so they never live in source control.
    |
    */

    'providers' => [

        'anthropic' => [
            'key' => env('ANTHROPIC_API_KEY'),
            'model' => env('ANTHROPIC_MODEL', 'claude-sonnet-5'),
        ],

        'openai' => [
            'key' => env('OPENAI_API_KEY'),
            'model' => env('OPENAI_MODEL', 'gpt-4o-mini'),
        ],

        'gemini' => [
            'key' => env('GEMINI_API_KEY'),
            'model' => env('GEMINI_MODEL', 'gemini-1.5-flash'),
        ],

    ],

];

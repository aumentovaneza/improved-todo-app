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
    | AI Feature Open Beta Overrides
    |--------------------------------------------------------------------------
    |
    | Every AI feature is pro-gated by default: AiEntitlementService::canUse()
    | allows only premium users unless the feature is listed here with a truthy
    | value, which opens it to everyone during a public beta. A feature that is
    | absent from this map (e.g. a brand-new AI feature) is premium-only — the
    | pro-gated default. Flip a flag to false to end that feature's open beta.
    |
    */

    'open_beta' => [
        'daily_summary' => env('AI_DAILY_SUMMARY_OPEN_BETA', true),
        'finance_insights' => env('AI_FINANCE_INSIGHTS_OPEN_BETA', true),
        'task_capture' => env('AI_TASK_CAPTURE_OPEN_BETA', false),
    ],

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

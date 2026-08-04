<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT_URI'),
    ],

    'meal_planning' => [
        'enabled' => env('MEAL_PLANNING_ENABLED', true),
        'rate_limits' => ['themealdb' => 60, 'spoonacular' => 50, 'usda_fdc' => 60, 'edamam' => 30, 'open_food_facts' => 30],
        'themealdb' => [
            'key' => env('THEMEALDB_API_KEY', '1'),
            'base_url' => env('THEMEALDB_BASE_URL', 'https://www.themealdb.com/api/json/v1'),
        ],
        'spoonacular' => [
            'key' => env('SPOONACULAR_API_KEY'),
            'base_url' => 'https://api.spoonacular.com',
        ],
        'usda' => [
            'key' => env('USDA_FDC_API_KEY'),
            'base_url' => 'https://api.nal.usda.gov/fdc/v1',
        ],
        'edamam' => [
            'app_id' => env('EDAMAM_APP_ID'),
            'app_key' => env('EDAMAM_APP_KEY'),
            'base_url' => 'https://api.edamam.com',
        ],
        'open_food_facts' => [
            'base_url' => env('OPEN_FOOD_FACTS_BASE_URL', 'https://world.openfoodfacts.org/api/v3'),
            'user_agent' => env('OPEN_FOOD_FACTS_USER_AGENT', 'Wevie/1.0 (https://wevie.app)'),
        ],
    ],

    /*
    | Web Push (VAPID) credentials for browser/PWA push notifications. Generate a
    | keypair with `php artisan webpush:vapid` and copy the values here. The
    | public key is also exposed to the frontend (see HandleInertiaRequests) so
    | the browser can subscribe; the private key must stay server-side. `subject`
    | is a contact URL or mailto: identifying the application server to push
    | services (required by the VAPID spec).
    */
    'vapid' => [
        'public_key' => env('VAPID_PUBLIC_KEY'),
        'private_key' => env('VAPID_PRIVATE_KEY'),
        'subject' => env('VAPID_SUBJECT', env('APP_URL', 'https://wevie.app')),
    ],

];

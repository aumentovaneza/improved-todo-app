<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>{{ config('app.name') }} test email</title>
</head>
<body style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #1f2937;">
    <div style="max-width: 560px; margin: 0 auto; padding: 24px;">
        <h1 style="font-size: 20px; color: #4ACF91; margin-bottom: 16px;">{{ config('app.name') }}</h1>
        <p style="white-space: pre-line; line-height: 1.6;">{{ $bodyText }}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="font-size: 12px; color: #6b7280;">
            Sent from the {{ config('app.name') }} admin Tools page.
        </p>
    </div>
</body>
</html>

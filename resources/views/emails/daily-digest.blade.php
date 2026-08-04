<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your daily digest</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:24px 0;">
        <tr>
            <td align="center">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">
                    <tr>
                        <td style="background:#4ACF91;padding:20px 32px;">
                            <span style="font-size:20px;font-weight:700;color:#ffffff;">{{ config('app.name') }}</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:32px;">
                            <h1 style="margin:0 0 8px;font-size:20px;">Good morning, {{ $user->name }}!</h1>
                            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#6b7280;">
                                Here is what is on your plate today.
                            </p>

                            @if ($digest['overdue_tasks']->isNotEmpty())
                                <h2 style="margin:0 0 8px;font-size:16px;color:#ef4444;">Overdue ({{ $digest['overdue_tasks']->count() }})</h2>
                                <ul style="margin:0 0 24px;padding-left:20px;font-size:15px;line-height:1.7;">
                                    @foreach ($digest['overdue_tasks'] as $task)
                                        <li>{{ $task->title }}@if ($task->due_date) <span style="color:#6b7280;">&mdash; {{ $task->due_date->format('M d') }}</span>@endif</li>
                                    @endforeach
                                </ul>
                            @endif

                            @if ($digest['today_tasks']->isNotEmpty())
                                <h2 style="margin:0 0 8px;font-size:16px;color:#1f2937;">Due today ({{ $digest['today_tasks']->count() }})</h2>
                                <ul style="margin:0 0 24px;padding-left:20px;font-size:15px;line-height:1.7;">
                                    @foreach ($digest['today_tasks'] as $task)
                                        <li>{{ $task->title }}</li>
                                    @endforeach
                                </ul>
                            @endif

                            @if ($digest['upcoming_tasks']->isNotEmpty())
                                <h2 style="margin:0 0 8px;font-size:16px;color:#5FDDE0;">Coming up ({{ $digest['upcoming_tasks']->count() }})</h2>
                                <ul style="margin:0 0 24px;padding-left:20px;font-size:15px;line-height:1.7;">
                                    @foreach ($digest['upcoming_tasks'] as $task)
                                        <li>{{ $task->title }}@if ($task->due_date) <span style="color:#6b7280;">&mdash; {{ $task->due_date->format('M d') }}</span>@endif</li>
                                    @endforeach
                                </ul>
                            @endif

                            <p style="margin:24px 0;">
                                <a href="{{ $url }}" style="background:#4ACF91;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;display:inline-block;">
                                    Open Wevie
                                </a>
                            </p>
                            <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
                                You are receiving this because you enabled the daily digest in {{ config('app.name') }}.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>

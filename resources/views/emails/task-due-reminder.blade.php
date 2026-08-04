<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Task due soon</title>
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
                            <h1 style="margin:0 0 16px;font-size:20px;">Hi {{ $user->name }},</h1>
                            <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
                                Your task <strong>&ldquo;{{ $task->title }}&rdquo;</strong> is due soon.
                            </p>
                            @if ($task->due_date)
                                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
                                    Due: <strong>{{ $task->due_date->format('M d, Y g:i A') }}</strong>
                                </p>
                            @endif
                            <p style="margin:24px 0;">
                                <a href="{{ $url }}" style="background:#4ACF91;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;display:inline-block;">
                                    View task
                                </a>
                            </p>
                            <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
                                You are receiving this because you enabled reminder emails in {{ config('app.name') }}.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>

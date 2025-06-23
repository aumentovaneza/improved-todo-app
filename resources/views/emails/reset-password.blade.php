@component('mail::message')
# Reset Your Password

Hello {{ $user->name ?? 'there' }},

You are receiving this email because we received a password reset request for your account.

@component('mail::button', ['url' => $url, 'color' => 'primary'])
Reset Password
@endcomponent

This password reset link will expire in {{ config('auth.passwords.users.expire') }} minutes.

If you did not request a password reset, no further action is required.

Thanks,<br>
{{ config('app.name') }}
@endcomponent 
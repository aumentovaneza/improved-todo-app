<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Wallet collaborator invite</title>
</head>
<body>
    <p>Hello,</p>
    <p>
        {{ $owner->name }} has invited you to collaborate on their wallet in
        {{ config('app.name') }}.
    </p>
    <p>
        Use this invite code when you register:
        <strong>{{ $inviteCode }}</strong>
    </p>
    <p>
        Sign up here: <a href="{{ $signupUrl }}">{{ $signupUrl }}</a>
    </p>
    <p>If you already have an account, ask {{ $owner->name }} to add your email.</p>
</body>
</html>

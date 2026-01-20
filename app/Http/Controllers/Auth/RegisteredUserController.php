<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\InviteCode;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:' . User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'invite_code' => 'required|string',
        ]);

        // Validate invite code
        $inviteCode = InviteCode::where('code', $request->invite_code)->first();

        if (!$inviteCode || !$inviteCode->isValid()) {
            return back()->withErrors([
                'invite_code' => 'The invite code is invalid, expired, or has been exhausted.'
            ])->withInput($request->except('password', 'password_confirmation'));
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        // Mark invite code as used
        $inviteCode->markAsUsed();

        $pendingInvites = DB::table('finance_wallet_invitations')
            ->where('email', $user->email)
            ->whereNull('used_at')
            ->where(function ($query) {
                $query->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->get();

        foreach ($pendingInvites as $invite) {
            $owner = User::find($invite->owner_user_id);
            if ($owner && !$owner->walletCollaborators()->where('users.id', $user->id)->exists()) {
                $owner->walletCollaborators()->attach($user->id, [
                    'role' => 'collaborator',
                    'joined_at' => now(),
                ]);
            }

            DB::table('finance_wallet_invitations')
                ->where('id', $invite->id)
                ->update(['used_at' => now(), 'updated_at' => now()]);
        }

        event(new Registered($user));

        Auth::login($user);

        return redirect(route('dashboard', absolute: false));
    }
}

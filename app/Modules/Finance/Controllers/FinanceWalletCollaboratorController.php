<?php

namespace App\Modules\Finance\Controllers;

use App\Http\Controllers\Controller;
use App\Mail\WalletCollaboratorInviteMail;
use App\Models\InviteCode;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;

class FinanceWalletCollaboratorController extends Controller
{
    public function search(Request $request): JsonResponse
    {
        $query = $request->string('query')->toString();
        if (strlen($query) < 2) {
            return response()->json([]);
        }

        $owner = Auth::user();
        $collaboratorIds = $owner->walletCollaborators()->pluck('users.id');

        $users = User::query()
            ->where(function ($builder) use ($query) {
                $builder->where('name', 'like', "%{$query}%")
                    ->orWhere('email', 'like', "%{$query}%");
            })
            ->where('id', '!=', $owner->id)
            ->whereNotIn('id', $collaboratorIds)
            ->orderBy('name')
            ->limit(6)
            ->get(['id', 'name', 'email']);

        return response()->json($users);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'user_id' => ['nullable', 'integer', 'exists:users,id', 'required_without:email'],
            'email' => ['nullable', 'email', 'required_without:user_id'],
        ]);

        $owner = Auth::user();
        $collaborator = null;
        $email = $request->string('email')->toString();

        if (!empty($validated['user_id'])) {
            $collaborator = User::find($validated['user_id']);
            $email = $collaborator?->email ?? $email;
        } elseif ($email !== '') {
            $collaborator = User::where('email', $email)->first();
        }

        if ($collaborator && $collaborator->id === $owner->id) {
            return back()->withErrors(['email' => 'You cannot add yourself as a collaborator.']);
        }

        if ($collaborator && $owner->walletCollaborators()->where('users.id', $collaborator->id)->exists()) {
            return back()->withErrors(['email' => 'User is already a collaborator on this wallet.']);
        }

        if ($collaborator) {
            $owner->walletCollaborators()->attach($collaborator->id, [
                'role' => 'collaborator',
                'joined_at' => now(),
            ]);

            return back()->with('success', 'Collaborator added successfully!');
        }

        $pendingInviteExists = \DB::table('finance_wallet_invitations')
            ->where('owner_user_id', $owner->id)
            ->where('email', $email)
            ->whereNull('used_at')
            ->where(function ($builder) {
                $builder->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->exists();

        if ($pendingInviteExists) {
            return back()->withErrors(['email' => 'An invite has already been sent to this email.']);
        }

        $inviteCode = InviteCode::create([
            'code' => InviteCode::generateUniqueCode(),
            'max_uses' => 1,
            'expires_at' => now()->addDays(14),
            'created_by' => $owner->id,
        ]);

        \DB::table('finance_wallet_invitations')->insert([
            'owner_user_id' => $owner->id,
            'email' => $email,
            'invite_code' => $inviteCode->code,
            'expires_at' => $inviteCode->expires_at,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Mail::to($email)->send(new WalletCollaboratorInviteMail(
            $owner,
            $inviteCode->code,
            $email
        ));

        return back()->with('success', 'Invite sent successfully!');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        $owner = Auth::user();
        $owner->walletCollaborators()->detach($user->id);

        return back()->with('success', 'Collaborator removed successfully!');
    }
}

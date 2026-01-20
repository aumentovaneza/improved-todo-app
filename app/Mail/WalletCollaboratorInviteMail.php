<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class WalletCollaboratorInviteMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $owner,
        public string $inviteCode,
        public string $inviteeEmail
    ) {}

    public function build(): self
    {
        return $this->subject('You are invited to collaborate on a wallet')
            ->view('emails.wallet-collaborator-invite', [
                'owner' => $this->owner,
                'inviteCode' => $this->inviteCode,
                'signupUrl' => route('register') . '?invite_code=' . urlencode($this->inviteCode)
                    . '&email=' . urlencode($this->inviteeEmail),
            ]);
    }
}

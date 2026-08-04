<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class TestToolEmail extends Mailable
{
    use Queueable, SerializesModels;

    public string $subjectLine;

    public string $bodyText;

    public function __construct(?string $subject = null, ?string $message = null)
    {
        $this->subjectLine = $subject ?: 'Wevie test email';
        $this->bodyText = $message ?: 'This is a test email sent from the Wevie admin Tools page. If you received it, email delivery is working.';
    }

    public function build(): self
    {
        return $this->subject($this->subjectLine)
            ->view('emails.admin-test', [
                'bodyText' => $this->bodyText,
            ]);
    }
}

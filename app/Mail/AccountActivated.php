<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AccountActivated extends Mailable
{
    use Queueable, SerializesModels;

    public $user;

    /**
     * Create a new message instance.
     */
    public function __construct(User $user)
    {
        $this->user = $user;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        // Use boybawang141@gmail.com as sender with "Admin" as the sender name
        $fromAddress = env('MAIL_FROM_ADDRESS', 'boybawang141@gmail.com');
        $fromName = 'Admin';
        
        return $this->from($fromAddress, $fromName)
                    ->subject('Account Activated - Research Proposal Management System')
                    ->view('emails.account-activated')
                    ->with([
                        'user' => $this->user,
                        'loginUrl' => url('/login'),
                    ]);
    }
}


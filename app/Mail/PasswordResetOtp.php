<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PasswordResetOtp extends Mailable
{
    use Queueable, SerializesModels;

    public $otp;
    public $email;

    /**
     * Create a new message instance.
     */
    public function __construct(string $otp, string $email)
    {
        $this->otp = $otp;
        $this->email = $email;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        // Use boybawang141@gmail.com as sender, or fallback to config
        $fromAddress = env('MAIL_FROM_ADDRESS', 'boybawang141@gmail.com');
        // Always use 'Admin' as sender name for password reset OTP emails
        $fromName = 'Admin';
        
        return $this->from($fromAddress, $fromName)
                    ->subject('Password Reset OTP - Research Proposal Management System')
                    ->view('emails.password-reset-otp')
                    ->with([
                        'otp' => $this->otp,
                        'email' => $this->email,
                    ]);
    }
}


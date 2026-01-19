<?php

namespace App\Mail;

use App\Models\User;
use App\Models\EmailTemplate;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AccountActivated extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    private $template;

    /**
     * Create a new message instance.
     */
    public function __construct(User $user)
    {
        $this->user = $user;
        $this->template = EmailTemplate::getByType('account-activated');
    }

    /**
     * Build the message.
     */
    public function build()
    {
        // Get admin's email from database - find first admin user
        $adminUser = User::whereHas('role', function ($query) {
            $query->where('userRole', 'Admin');
        })->first();
        
        $fromAddress = $adminUser?->email ?? env('MAIL_FROM_ADDRESS', 'noreply@system.local');
        $fromName = $adminUser 
            ? $adminUser->firstName . ' ' . $adminUser->lastName . ' (System)'
            : env('MAIL_FROM_NAME', 'Research Proposal Management System');
        
        // Get template or use default
        $subject = $this->template?->subject ?? 'Your Account Has Been Activated';
        
        // Replace variables in subject
        $subject = $this->replaceVariables($subject);
        
        // Get body from template
        $htmlBody = $this->template?->body ?? $this->getDefaultTemplate();
        
        // Replace variables in body
        $htmlBody = $this->replaceVariables($htmlBody);
        
        return $this->from($fromAddress, $fromName)
                    ->subject($subject)
                    ->html($htmlBody);
    }

    /**
     * Replace template variables
     */
    private function replaceVariables(string $content): string
    {
        $replacements = [
            '{user_name}' => $this->user->firstName . ' ' . $this->user->lastName,
            '{user_email}' => $this->user->email,
            '{login_url}' => url('/login'),
            '{system_name}' => env('APP_NAME', 'Research Proposal Management System'),
            '{current_year}' => date('Y'),
        ];

        return str_replace(array_keys($replacements), array_values($replacements), $content);
    }

    /**
     * Get default template if none exists
     */
    private function getDefaultTemplate(): string
    {
        return <<<'HTML'
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Activated</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
        }
        .email-container {
            max-width: 450px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            background-color: #3b82f6;
            color: white;
            padding: 18px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 20px;
            font-weight: 600;
        }
        .content {
            padding: 24px 20px;
        }
        .greeting {
            font-size: 15px;
            margin-bottom: 12px;
            color: #1f2937;
        }
        .message {
            font-size: 14px;
            color: #4b5563;
            margin-bottom: 0;
            line-height: 1.6;
        }
        .btn {
            display: inline-block;
            padding: 10px 24px;
            background-color: #3b82f6;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin-top: 16px;
        }
        .footer {
            padding: 16px 20px;
            background-color: #f9fafb;
            border-top: 1px solid #e5e7eb;
            text-align: center;
        }
        .footer p {
            font-size: 12px;
            color: #6b7280;
            margin: 0;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>✓ Account Activated</h1>
        </div>
        <div class="content">
            <div class="greeting">
                Hello {user_name},
            </div>
            <div class="message">
                <p>Great news! Your account has been approved and activated. You can now log in to the Research Proposal Management System using your credentials.</p>
                <p>Visit the login page to get started:</p>
                <a href="{login_url}" class="btn">Log In Now</a>
            </div>
        </div>
        <div class="footer">
            <p>&copy; 2026 {system_name}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
HTML;
    }
}



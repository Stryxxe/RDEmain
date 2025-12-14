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
        .footer {
            padding: 16px 20px;
            background-color: #f9fafb;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 11px;
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>Account Activated</h1>
        </div>
        <div class="content">
            <p class="greeting">Dear {{ $user->firstName }} {{ $user->lastName }},</p>
            
            <p class="message">Your account has been successfully activated. You may now log in to the system.</p>
        </div>
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>

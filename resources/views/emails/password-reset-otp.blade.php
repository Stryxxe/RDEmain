<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset OTP</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .content {
            background-color: #ffffff;
            padding: 40px 30px;
            border-radius: 8px;
        }
        .otp-code {
            font-size: 24px;
            font-weight: 500;
            color: #1a73e8;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
            text-align: center;
            margin: 30px 0;
            padding: 10px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            color: #6b7280;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="content">
        <p>Dear User,</p>
        
        <p>We received a request to reset your password for your account ({{ $email }}).</p>
        
        <p>Your verification code is:</p>
        
        <div class="otp-code">{{ $otp }}</div>
        
        <p style="margin-top: 30px;">This code will expire in 15 minutes.</p>
        
        <p style="margin-top: 20px;">If you didn't request this code, you can safely ignore this email.</p>
        
        <p style="margin-top: 30px;">Best regards,<br>
        Research Proposal Management System<br>
        University of Southeastern Philippines</p>
    </div>
    <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
    </div>
</body>
</html>




<?php
require 'vendor/autoload.php';

use Dotenv\Dotenv;
use PHPMailer\PHPMailer\PHPMailer;

// Load environment
$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

echo "=== Email Configuration Test ===\n\n";

// Check .env settings
$mailMailer = env('MAIL_MAILER');
$mailHost = env('MAIL_HOST');
$mailPort = env('MAIL_PORT');
$mailUsername = env('MAIL_USERNAME');
$mailPassword = env('MAIL_PASSWORD');
$mailFromAddress = env('MAIL_FROM_ADDRESS');

echo "Configuration:\n";
echo "MAIL_MAILER: $mailMailer\n";
echo "MAIL_HOST: $mailHost\n";
echo "MAIL_PORT: $mailPort\n";
echo "MAIL_USERNAME: $mailUsername\n";
echo "MAIL_PASSWORD: " . (strlen($mailPassword) > 0 ? str_repeat('*', strlen($mailPassword)) : 'EMPTY') . "\n";
echo "MAIL_FROM_ADDRESS: $mailFromAddress\n\n";

// Try to connect to SMTP
echo "Testing SMTP Connection...\n";
$fp = @fsockopen($mailHost, $mailPort, $errno, $errstr, 10);
if ($fp) {
    echo "✅ SMTP Connection: SUCCESS\n";
    fclose($fp);
} else {
    echo "❌ SMTP Connection: FAILED - $errstr ($errno)\n";
    exit(1);
}

echo "\nNote: To actually send emails, the Gmail account password must be an App Password\n";
echo "(not your regular Gmail password)\n";
echo "You can generate one at: https://myaccount.google.com/apppasswords\n";
?>

<?php
require 'vendor/autoload.php';

use Dotenv\Dotenv;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

// Setup Laravel
$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== Email Test Mailer ===\n\n";

// Get a test user (use the first activated user)
$testUser = User::where('status', 'active')->first();

if (!$testUser) {
    echo "❌ No active users found. Please activate a user first.\n";
    exit(1);
}

echo "Test User: {$testUser->firstName} {$testUser->lastName}\n";
echo "Email: {$testUser->email}\n\n";

// Try to send
echo "Sending test email...\n";
try {
    Mail::to($testUser->email)->send(new \App\Mail\AccountActivated($testUser));
    echo "✅ Email sent successfully!\n";
    echo "\nNote: Check the user's spam/junk folder if not in inbox.\n";
} catch (\Exception $e) {
    echo "❌ Failed to send email:\n";
    echo "Error: " . $e->getMessage() . "\n\n";
    
    // Check logs
    echo "Recent log entries:\n";
    $logFile = storage_path('logs/laravel.log');
    if (file_exists($logFile)) {
        $lines = array_slice(file($logFile), -20);
        foreach ($lines as $line) {
            if (strpos(strtolower($line), 'mail') !== false || strpos(strtolower($line), 'error') !== false) {
                echo trim($line) . "\n";
            }
        }
    }
}
?>

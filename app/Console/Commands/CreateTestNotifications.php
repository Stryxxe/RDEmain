<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Notification;
use App\Models\User;

class CreateTestNotifications extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notifications:create-test {count=5 : Number of notifications to create}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create test notifications for the current user';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $count = (int) $this->argument('count');
        
        // Get the first user (or you can modify this to get a specific user)
        $user = User::first();
        
        if (!$user) {
            $this->error('No users found. Please run UserSeeder first.');
            return 1;
        }

        $testNotifications = [
            [
                'type' => 'success',
                'title' => 'Test Notification - Success',
                'message' => 'This is a test success notification to verify the notification system is working properly.',
                'data' => ['test' => true, 'type' => 'success'],
                'read' => false,
            ],
            [
                'type' => 'error',
                'title' => 'Test Notification - Error',
                'message' => 'This is a test error notification to check error handling and display.',
                'data' => ['test' => true, 'type' => 'error'],
                'read' => false,
            ],
            [
                'type' => 'warning',
                'title' => 'Test Notification - Warning',
                'message' => 'This is a test warning notification to verify warning styling and behavior.',
                'data' => ['test' => true, 'type' => 'warning'],
                'read' => false,
            ],
            [
                'type' => 'info',
                'title' => 'Test Notification - Info',
                'message' => 'This is a test info notification to check information display and formatting.',
                'data' => ['test' => true, 'type' => 'info'],
                'read' => false,
            ],
            [
                'type' => 'success',
                'title' => 'Test Notification - Read',
                'message' => 'This is a test notification that is already marked as read.',
                'data' => ['test' => true, 'type' => 'read'],
                'read' => true,
                'read_at' => now()->subMinutes(30),
            ],
        ];

        for ($i = 0; $i < $count; $i++) {
            $notificationData = $testNotifications[$i % count($testNotifications)];
            
            Notification::create([
                'userID' => $user->userID,
                'type' => $notificationData['type'],
                'title' => $notificationData['title'] . ' #' . ($i + 1),
                'message' => $notificationData['message'],
                'data' => $notificationData['data'],
                'read' => $notificationData['read'],
                'read_at' => $notificationData['read_at'] ?? null,
                'created_at' => now()->subMinutes(rand(0, 60)),
            ]);
        }

        $this->info("Created {$count} test notifications for user: {$user->firstName} {$user->lastName}");
        return 0;
    }
}
<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Notification;
use App\Models\User;

class NotificationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get some users to create notifications for
        $users = User::take(5)->get();
        
        if ($users->isEmpty()) {
            $this->command->warn('No users found. Please run UserSeeder first.');
            return;
        }

        $notifications = [
            [
                'type' => 'success',
                'title' => 'Proposal Submitted Successfully',
                'message' => 'Your proposal "AI-Powered Research Analysis" has been submitted for review.',
                'data' => [
                    'proposal_id' => 1,
                    'proposal_title' => 'AI-Powered Research Analysis',
                    'event' => 'proposal.submitted'
                ],
                'read' => false,
            ],
            [
                'type' => 'info',
                'title' => 'Proposal Status Updated',
                'message' => 'Your proposal "Machine Learning in Healthcare" is now under review.',
                'data' => [
                    'proposal_id' => 2,
                    'proposal_title' => 'Machine Learning in Healthcare',
                    'old_status' => 'draft',
                    'new_status' => 'under_review',
                    'event' => 'proposal.status.updated'
                ],
                'read' => false,
            ],
            [
                'type' => 'success',
                'title' => 'Proposal Approved',
                'message' => 'Congratulations! Your proposal "Sustainable Energy Solutions" has been approved.',
                'data' => [
                    'proposal_id' => 3,
                    'proposal_title' => 'Sustainable Energy Solutions',
                    'old_status' => 'under_review',
                    'new_status' => 'approved',
                    'event' => 'proposal.status.updated'
                ],
                'read' => true,
                'read_at' => now()->subHours(2),
            ],
            [
                'type' => 'error',
                'title' => 'Proposal Rejected',
                'message' => 'Your proposal "Blockchain Technology Research" has been rejected. Please review the feedback.',
                'data' => [
                    'proposal_id' => 4,
                    'proposal_title' => 'Blockchain Technology Research',
                    'old_status' => 'under_review',
                    'new_status' => 'rejected',
                    'event' => 'proposal.status.updated'
                ],
                'read' => false,
            ],
            [
                'type' => 'warning',
                'title' => 'Revision Required',
                'message' => 'Your proposal "Climate Change Impact Study" requires revisions before approval.',
                'data' => [
                    'proposal_id' => 5,
                    'proposal_title' => 'Climate Change Impact Study',
                    'old_status' => 'under_review',
                    'new_status' => 'revision_required',
                    'event' => 'proposal.status.updated'
                ],
                'read' => false,
            ],
            [
                'type' => 'info',
                'title' => 'System Maintenance',
                'message' => 'The system will undergo maintenance on Sunday from 2:00 AM to 4:00 AM.',
                'data' => [
                    'event' => 'system.maintenance'
                ],
                'read' => true,
                'read_at' => now()->subDays(1),
            ],
            [
                'type' => 'success',
                'title' => 'New Feature Available',
                'message' => 'Check out the new proposal tracking dashboard with enhanced analytics.',
                'data' => [
                    'event' => 'feature.announcement'
                ],
                'read' => false,
            ],
        ];

        foreach ($users as $user) {
            // Create 3-5 notifications per user
            $userNotifications = collect($notifications)->random(rand(3, 5));
            
            foreach ($userNotifications as $notificationData) {
                Notification::create([
                    'userID' => $user->userID,
                    'type' => $notificationData['type'],
                    'title' => $notificationData['title'],
                    'message' => $notificationData['message'],
                    'data' => $notificationData['data'],
                    'read' => $notificationData['read'],
                    'read_at' => $notificationData['read_at'] ?? null,
                    'created_at' => now()->subDays(rand(0, 7))->subHours(rand(0, 23)),
                ]);
            }
        }

        $this->command->info('Created sample notifications for ' . $users->count() . ' users.');
    }
}

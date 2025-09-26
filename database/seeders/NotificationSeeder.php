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
            // Proposal Status Updates
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
                'type' => 'success',
                'title' => 'Proposal Approved',
                'message' => 'Your proposal "Renewable Energy Integration" has been approved for funding.',
                'data' => [
                    'proposal_id' => 6,
                    'proposal_title' => 'Renewable Energy Integration',
                    'old_status' => 'under_review',
                    'new_status' => 'approved',
                    'event' => 'proposal.status.updated'
                ],
                'read' => false,
            ],
            [
                'type' => 'info',
                'title' => 'Proposal Under Review',
                'message' => 'Your proposal "Digital Health Solutions" is currently being reviewed by the RDD committee.',
                'data' => [
                    'proposal_id' => 7,
                    'proposal_title' => 'Digital Health Solutions',
                    'old_status' => 'submitted',
                    'new_status' => 'under_review',
                    'event' => 'proposal.status.updated'
                ],
                'read' => false,
            ],
            [
                'type' => 'warning',
                'title' => 'Document Missing',
                'message' => 'Your proposal "Smart Agriculture Systems" is missing the required GAD certificate.',
                'data' => [
                    'proposal_id' => 8,
                    'proposal_title' => 'Smart Agriculture Systems',
                    'missing_document' => 'GAD Certificate',
                    'event' => 'proposal.document.missing'
                ],
                'read' => false,
            ],
            [
                'type' => 'success',
                'title' => 'Proposal Funded',
                'message' => 'Great news! Your proposal "IoT in Education" has been approved and funded with ₱500,000.',
                'data' => [
                    'proposal_id' => 9,
                    'proposal_title' => 'IoT in Education',
                    'funding_amount' => 500000,
                    'event' => 'proposal.funded'
                ],
                'read' => true,
                'read_at' => now()->subHours(5),
            ],
            [
                'type' => 'error',
                'title' => 'Proposal Withdrawn',
                'message' => 'Your proposal "Cybersecurity Framework" has been withdrawn due to incomplete documentation.',
                'data' => [
                    'proposal_id' => 10,
                    'proposal_title' => 'Cybersecurity Framework',
                    'reason' => 'Incomplete documentation',
                    'event' => 'proposal.withdrawn'
                ],
                'read' => false,
            ],
            
            // System Notifications
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
            [
                'type' => 'info',
                'title' => 'System Update',
                'message' => 'The system has been updated with improved performance and new features.',
                'data' => [
                    'event' => 'system.update'
                ],
                'read' => false,
            ],
            [
                'type' => 'warning',
                'title' => 'Password Expiry Reminder',
                'message' => 'Your password will expire in 7 days. Please update it to maintain account security.',
                'data' => [
                    'event' => 'security.password_expiry'
                ],
                'read' => false,
            ],
            
            // Review and Feedback
            [
                'type' => 'info',
                'title' => 'Review Assignment',
                'message' => 'You have been assigned to review the proposal "Advanced Data Analytics".',
                'data' => [
                    'proposal_id' => 11,
                    'proposal_title' => 'Advanced Data Analytics',
                    'event' => 'review.assigned'
                ],
                'read' => false,
            ],
            [
                'type' => 'success',
                'title' => 'Review Completed',
                'message' => 'Thank you for completing the review of "Environmental Monitoring System".',
                'data' => [
                    'proposal_id' => 12,
                    'proposal_title' => 'Environmental Monitoring System',
                    'event' => 'review.completed'
                ],
                'read' => true,
                'read_at' => now()->subHours(3),
            ],
            [
                'type' => 'info',
                'title' => 'Feedback Received',
                'message' => 'You have received feedback on your proposal "Smart City Solutions".',
                'data' => [
                    'proposal_id' => 13,
                    'proposal_title' => 'Smart City Solutions',
                    'event' => 'feedback.received'
                ],
                'read' => false,
            ],
            
            // Meeting and Events
            [
                'type' => 'info',
                'title' => 'Meeting Scheduled',
                'message' => 'A meeting has been scheduled for your proposal "Biotechnology Research" on March 15, 2024.',
                'data' => [
                    'proposal_id' => 14,
                    'proposal_title' => 'Biotechnology Research',
                    'meeting_date' => '2024-03-15',
                    'event' => 'meeting.scheduled'
                ],
                'read' => false,
            ],
            [
                'type' => 'warning',
                'title' => 'Meeting Reminder',
                'message' => 'Reminder: You have a meeting tomorrow at 2:00 PM for "Robotics in Manufacturing".',
                'data' => [
                    'proposal_id' => 15,
                    'proposal_title' => 'Robotics in Manufacturing',
                    'meeting_time' => '2:00 PM',
                    'event' => 'meeting.reminder'
                ],
                'read' => false,
            ],
            
            // Deadline Reminders
            [
                'type' => 'warning',
                'title' => 'Deadline Approaching',
                'message' => 'The submission deadline for "Quantum Computing Research" is in 3 days.',
                'data' => [
                    'proposal_id' => 16,
                    'proposal_title' => 'Quantum Computing Research',
                    'days_remaining' => 3,
                    'event' => 'deadline.reminder'
                ],
                'read' => false,
            ],
            [
                'type' => 'error',
                'title' => 'Deadline Missed',
                'message' => 'The submission deadline for "Artificial Intelligence Ethics" has passed.',
                'data' => [
                    'proposal_id' => 17,
                    'proposal_title' => 'Artificial Intelligence Ethics',
                    'event' => 'deadline.missed'
                ],
                'read' => false,
            ],
        ];

        foreach ($users as $user) {
            // Create 8-12 notifications per user for better testing
            $userNotifications = collect($notifications)->random(rand(8, 12));
            
            foreach ($userNotifications as $notificationData) {
                Notification::create([
                    'userID' => $user->userID,
                    'type' => $notificationData['type'],
                    'title' => $notificationData['title'],
                    'message' => $notificationData['message'],
                    'data' => $notificationData['data'],
                    'read' => $notificationData['read'],
                    'read_at' => $notificationData['read_at'] ?? null,
                    'created_at' => now()->subDays(rand(0, 30))->subHours(rand(0, 23))->subMinutes(rand(0, 59)),
                ]);
            }
        }

        $this->command->info('Created sample notifications for ' . $users->count() . ' users.');
    }
}

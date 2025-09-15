<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Message;
use App\Models\User;

class MessageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get some users to create messages for
        $users = User::take(5)->get();
        
        if ($users->isEmpty()) {
            $this->command->warn('No users found. Please run UserSeeder first.');
            return;
        }

        $messages = [
            [
                'subject' => 'Proposal Review Update',
                'content' => 'Your proposal has been reviewed and is currently under consideration. We will notify you of the decision within 5 business days.',
                'type' => 'proposal_update',
            ],
            [
                'subject' => 'Meeting Request',
                'content' => 'We would like to schedule a meeting to discuss your research proposal in more detail. Please let us know your availability for next week.',
                'type' => 'general',
            ],
            [
                'subject' => 'Documentation Required',
                'content' => 'Please submit the additional documentation requested for your proposal. The deadline is next Friday.',
                'type' => 'proposal_update',
            ],
            [
                'subject' => 'Congratulations on Approval',
                'content' => 'Congratulations! Your proposal has been approved. You can now proceed with your research project. Please check the next steps in your dashboard.',
                'type' => 'proposal_update',
            ],
            [
                'subject' => 'System Update Notification',
                'content' => 'The research management system has been updated with new features. Please log in to explore the improvements.',
                'type' => 'system',
            ],
            [
                'subject' => 'Research Collaboration Opportunity',
                'content' => 'We have identified a potential collaboration opportunity that aligns with your research interests. Would you like to learn more?',
                'type' => 'general',
            ],
            [
                'subject' => 'Budget Allocation Information',
                'content' => 'Your approved proposal has been allocated a budget of $50,000. Please review the budget guidelines and submit your spending plan.',
                'type' => 'proposal_update',
            ],
            [
                'subject' => 'Deadline Reminder',
                'content' => 'This is a friendly reminder that your proposal submission deadline is approaching. Please ensure all documents are submitted on time.',
                'type' => 'system',
            ],
        ];

        // Create messages between users
        for ($i = 0; $i < 20; $i++) {
            $sender = $users->random();
            $recipient = $users->where('userID', '!=', $sender->userID)->random();
            $messageData = collect($messages)->random();
            
            $isRead = rand(0, 1) === 1;
            
            Message::create([
                'senderID' => $sender->userID,
                'recipientID' => $recipient->userID,
                'subject' => $messageData['subject'],
                'content' => $messageData['content'],
                'type' => $messageData['type'],
                'read' => $isRead,
                'read_at' => $isRead ? now()->subDays(rand(0, 3))->subHours(rand(0, 23)) : null,
                'created_at' => now()->subDays(rand(0, 10))->subHours(rand(0, 23)),
            ]);
        }

        $this->command->info('Created 20 sample messages between users.');
    }
}

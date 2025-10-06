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
        // Clear existing messages
        Message::truncate();
        
        // Get some users for creating sample messages
        $cmIct = User::where('email', 'cm-ict@usep.edu.ph')->first();
        $proponentIct = User::where('email', 'sarah.johnson@usep.edu.ph')->first();
        
        $cmEnv = User::where('email', 'cm-environment@usep.edu.ph')->first();
        $proponentEnv = User::where('email', 'maria.cruz@usep.edu.ph')->first();
        
        $cmIndigenous = User::where('email', 'cm-indigenous@usep.edu.ph')->first();
        $proponentIndigenous = User::where('email', 'juan.santos@usep.edu.ph')->first();
        
        if ($cmIct && $proponentIct) {
            // Create messages between ICT CM and proponent
            Message::create([
                'senderID' => $proponentIct->userID,
                'recipientID' => $cmIct->userID,
                'subject' => 'Proposal Submission Inquiry',
                'content' => 'Hello Dr. Martinez, I would like to discuss my research proposal submission. Could we schedule a meeting?',
                'type' => 'general',
                'read' => false,
                'created_at' => now()->subHours(2)
            ]);
            
            Message::create([
                'senderID' => $cmIct->userID,
                'recipientID' => $proponentIct->userID,
                'subject' => 'Re: Proposal Submission Inquiry',
                'content' => 'Hello Dr. Johnson, I would be happy to discuss your proposal. How about tomorrow at 2 PM?',
                'type' => 'reply',
                'read' => true,
                'created_at' => now()->subHours(1)
            ]);
            
            Message::create([
                'senderID' => $proponentIct->userID,
                'recipientID' => $cmIct->userID,
                'subject' => 'Re: Proposal Submission Inquiry',
                'content' => 'That works perfectly! I will prepare the necessary documents. Thank you!',
                'type' => 'reply',
                'read' => false,
                'created_at' => now()->subMinutes(30)
            ]);
        }
        
        if ($cmEnv && $proponentEnv) {
            // Create messages between Environmental CM and proponent
            Message::create([
                'senderID' => $proponentEnv->userID,
                'recipientID' => $cmEnv->userID,
                'subject' => 'Environmental Research Update',
                'content' => 'Dr. Santos, I have completed the initial phase of my environmental research. Should I proceed with the next phase?',
                'type' => 'general',
                'read' => false,
                'created_at' => now()->subDays(1)
            ]);
        }
        
        if ($cmIndigenous && $proponentIndigenous) {
            // Create messages between Indigenous CM and proponent
            Message::create([
                'senderID' => $proponentIndigenous->userID,
                'recipientID' => $cmIndigenous->userID,
                'subject' => 'Cultural Heritage Documentation',
                'content' => 'Dr. Torres, I need guidance on the cultural heritage documentation requirements for my research.',
                'type' => 'general',
                'read' => true,
                'created_at' => now()->subDays(2)
            ]);
            
            Message::create([
                'senderID' => $cmIndigenous->userID,
                'recipientID' => $proponentIndigenous->userID,
                'subject' => 'Re: Cultural Heritage Documentation',
                'content' => 'Prof. Santos, I will send you the detailed requirements document. Please review it and let me know if you have any questions.',
                'type' => 'reply',
                'read' => false,
                'created_at' => now()->subDays(1)
            ]);
        }
        
        $this->command->info('Created sample messages between CM and proponents in the same departments.');
    }
}

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
        
        $this->command->info('Messages table cleared - no sample messages created.');
        $this->command->info('Users can now start fresh conversations using the Start Conversation button.');
    }
}

<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Activity;
use App\Models\User;

class ActivitySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = User::where('email', 'admin@rdeproject.test')->first();
        $adminId = $admin?->userID ?? 1;

        Activity::create([
            'userID' => $adminId,
            'action' => 'create',
            'description' => 'Created new user: John Doe (Reviewer)',
            'model_type' => 'User',
            'model_id' => 1,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        ]);

        Activity::create([
            'userID' => $adminId,
            'action' => 'update',
            'description' => 'Updated system setting: Max File Size changed to 20MB',
            'model_type' => 'Settings',
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'old_values' => ['maxFileSize' => '10'],
            'new_values' => ['maxFileSize' => '20'],
        ]);

        Activity::create([
            'userID' => $adminId,
            'action' => 'delete',
            'description' => 'Deleted research center: Old Laboratory',
            'model_type' => 'ResearchCenter',
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        ]);

        Activity::create([
            'userID' => $adminId,
            'action' => 'create',
            'description' => 'Created new timeline stage: Endorsement Review',
            'model_type' => 'TimelineStage',
            'model_id' => 2,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        ]);

        Activity::create([
            'userID' => $adminId,
            'action' => 'update',
            'description' => 'Updated user: Jane Smith - Promoted to Senior Reviewer',
            'model_type' => 'User',
            'model_id' => 2,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'old_values' => ['role' => 'Reviewer'],
            'new_values' => ['role' => 'Senior Reviewer'],
        ]);

        Activity::create([
            'userID' => $adminId,
            'action' => 'create',
            'description' => 'Created new department: Engineering Research',
            'model_type' => 'Department',
            'model_id' => 1,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        ]);

        Activity::create([
            'userID' => $adminId,
            'action' => 'create',
            'description' => 'Created new project role: Principal Investigator',
            'model_type' => 'Role',
            'model_id' => 1,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        ]);

        Activity::create([
            'userID' => $adminId,
            'action' => 'delete',
            'description' => 'Deleted user: Robert Johnson (Inactive Reviewer)',
            'model_type' => 'User',
            'model_id' => 5,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        ]);
    }
}

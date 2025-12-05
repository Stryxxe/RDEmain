<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\Activity;
use App\Models\User;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $admin = User::where('email', 'admin@rdeproject.test')->first();
        $adminId = $admin?->userID ?? 1;

        Activity::create([
            'userID' => $adminId,
            'action' => 'create',
            'description' => 'Created new user: John Doe',
            'model_type' => 'User',
            'model_id' => 1,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Mozilla/5.0',
        ]);

        Activity::create([
            'userID' => $adminId,
            'action' => 'update',
            'description' => 'Updated system setting: Max File Size to 20MB',
            'model_type' => 'Settings',
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Mozilla/5.0',
            'old_values' => json_encode(['maxFileSize' => '10']),
            'new_values' => json_encode(['maxFileSize' => '20']),
        ]);

        Activity::create([
            'userID' => $adminId,
            'action' => 'delete',
            'description' => 'Deleted research center: Old Lab',
            'model_type' => 'ResearchCenter',
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Mozilla/5.0',
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Activity::whereIn('action', ['create', 'update', 'delete'])->delete();
    }
};

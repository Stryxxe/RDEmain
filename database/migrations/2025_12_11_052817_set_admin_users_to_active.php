<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Check if status column exists
        if (Schema::hasColumn('users', 'status')) {
            // Get Admin role ID
            $adminRole = DB::table('user_roles')->where('userRole', 'Admin')->first();
            
            if ($adminRole) {
                // Set all admin users to 'active' status
                DB::table('users')
                    ->where('userRolesID', $adminRole->userRoleID)
                    ->update(['status' => 'active']);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This migration doesn't need to be reversed
        // Admin users should remain active
    }
};

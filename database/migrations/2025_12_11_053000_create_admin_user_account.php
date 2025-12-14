<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Get Admin role ID
        $adminRole = DB::table('user_roles')->where('userRole', 'Admin')->first();
        
        if (!$adminRole) {
            throw new \Exception('Admin role not found! Please ensure user_roles table is seeded.');
        }

        // Check if admin user already exists
        $existingAdmin = DB::table('users')->where('email', 'admin@usep.edu.ph')->first();
        
        if ($existingAdmin) {
            // Update existing admin user if needed
            DB::table('users')
                ->where('email', 'admin@usep.edu.ph')
                ->update([
                    'userRolesID' => $adminRole->userRoleID,
                    'status' => 'active',
                    'password' => Hash::make('password'),
                    'updated_at' => now(),
                ]);
            return;
        }

        // Create admin user
        DB::table('users')->insert([
            'firstName' => 'Admin',
            'lastName' => 'User',
            'email' => 'admin@usep.edu.ph',
            'password' => Hash::make('password'),
            'userRolesID' => $adminRole->userRoleID,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove the admin user
        DB::table('users')->where('email', 'admin@usep.edu.ph')->delete();
    }
};


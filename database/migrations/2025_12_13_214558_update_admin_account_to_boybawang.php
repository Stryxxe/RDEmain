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

        // Get Information Technology department (or any department for admin)
        $itDepartment = DB::table('departments')
            ->where('name', 'Information Technology')
            ->orWhere('name', 'LIKE', '%IT%')
            ->first();
        
        $departmentID = $itDepartment ? $itDepartment->departmentID : null;

        // Remove old admin account if it exists
        DB::table('users')->where('email', 'admin@usep.edu.ph')->delete();

        // Check if new admin account already exists
        $existingAdmin = DB::table('users')->where('email', 'boybawang141@gmail.com')->first();
        
        if ($existingAdmin) {
            // Update existing admin to ensure it has Admin role and active status
            DB::table('users')
                ->where('email', 'boybawang141@gmail.com')
                ->update([
                    'firstName' => 'Admin',
                    'lastName' => 'User',
                    'userRolesID' => $adminRole->userRoleID,
                    'status' => 'active',
                    'password' => Hash::make('password'),
                    'departmentID' => $departmentID,
                    'updated_at' => now(),
                ]);
        } else {
            // Create new admin account
            DB::table('users')->insert([
                'firstName' => 'Admin',
                'lastName' => 'User',
                'email' => 'boybawang141@gmail.com',
                'password' => Hash::make('password'),
                'userRolesID' => $adminRole->userRoleID,
                'status' => 'active',
                'departmentID' => $departmentID,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove new admin account
        DB::table('users')->where('email', 'boybawang141@gmail.com')->delete();
    }
};

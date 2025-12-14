<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use App\Models\Department;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get Admin role
        $adminRole = Role::where('userRole', 'Admin')->first();
        
        if (!$adminRole) {
            $this->command->error('Admin role not found! Please run RoleSeeder first.');
            return;
        }

        // Get Information Technology department
        $itDepartment = Department::where('name', 'Information Technology')->first();
        
        if (!$itDepartment) {
            $this->command->error('Information Technology department not found! Please run DepartmentSeeder first.');
            return;
        }

        // Admin user data
        $adminData = [
            'firstName' => 'Admin',
            'lastName' => 'User',
            'email' => 'admin@usep.edu.ph',
            'password' => Hash::make('admin123'), // Default password - change after first login
            'departmentID' => $itDepartment->departmentID,
            'userRolesID' => $adminRole->userRoleID,
            'status' => 'active', // Admin users should always be active
        ];

        // Check if admin user already exists
        $existingAdmin = User::where('email', $adminData['email'])->first();
        
        if ($existingAdmin) {
            // Update existing admin to ensure status is active
            $existingAdmin->update(['status' => 'active']);
            $this->command->warn("Admin user with email {$adminData['email']} already exists!");
            $this->command->info("User ID: {$existingAdmin->userID}");
            $this->command->info("Name: {$existingAdmin->fullName}");
            $this->command->info("Status updated to: active");
            return;
        }

        // Create admin user
        $admin = User::create($adminData);
        
        $this->command->info('Admin user created successfully!');
        $this->command->info("User ID: {$admin->userID}");
        $this->command->info("Name: {$admin->fullName}");
        $this->command->info("Email: {$admin->email}");
        $this->command->warn("Default Password: admin123 (Please change after first login)");
    }
}






<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use App\Models\Department;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run()
    {
        // Get roles
        $adminRole = Role::where('userRole', 'Admin')->first();
        $rddRole = Role::where('userRole', 'RDD')->first();
        $cmRole = Role::where('userRole', 'CM')->first();
        $proponentRole = Role::where('userRole', 'Proponent')->first();
        $opRole = Role::where('userRole', 'OP')->first();
        $osuurRole = Role::where('userRole', 'OSUORU')->first();
        $reviewerRole = Role::where('userRole', 'Reviewer')->first();

        // Get departments
        $rddDept = Department::where('name', 'Research and Development Division')->first();
        $cmDept = Department::where('name', 'College of Medicine')->first();
        $opDept = Department::where('name', 'Office of the President')->first();
        $osuurDept = Department::where('name', 'Office of Student Affairs and University Relations Unit')->first();
        $academicDept = Department::where('name', 'Academic Affairs')->first();

        // Create users for each role
        $users = [
            // Admin
            [
                'firstName' => 'John',
                'lastName' => 'Admin',
                'email' => 'admin@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $opDept->departmentID,
                'userRolesID' => $adminRole->userRoleID,
            ],
            
            // RDD
            [
                'firstName' => 'Maria',
                'lastName' => 'Santos',
                'email' => 'rdd@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $rddDept->departmentID,
                'userRolesID' => $rddRole->userRoleID,
            ],
            
            // CM
            [
                'firstName' => 'Dr. Robert',
                'lastName' => 'Garcia',
                'email' => 'cm@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $cmDept->departmentID,
                'userRolesID' => $cmRole->userRoleID,
            ],
            
            // CM (Center Manager) for Academic Affairs (same department as proponent)
            [
                'firstName' => 'Dr. Jennifer',
                'lastName' => 'Martinez',
                'email' => 'cm-academic@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $academicDept->departmentID,
                'userRolesID' => $cmRole->userRoleID,
            ],
            
            // Proponent
            [
                'firstName' => 'Sarah',
                'lastName' => 'Johnson',
                'email' => 'proponent@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $academicDept->departmentID,
                'userRolesID' => $proponentRole->userRoleID,
            ],
            
            // OP
            [
                'firstName' => 'Michael',
                'lastName' => 'Brown',
                'email' => 'op@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $opDept->departmentID,
                'userRolesID' => $opRole->userRoleID,
            ],
            
            // OSUORU
            [
                'firstName' => 'Lisa',
                'lastName' => 'Wilson',
                'email' => 'osuur@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $osuurDept->departmentID,
                'userRolesID' => $osuurRole->userRoleID,
            ],
            
            // Reviewer
            [
                'firstName' => 'Dr. James',
                'lastName' => 'Miller',
                'email' => 'reviewer@usep.edu.ph',
                'password' => Hash::make('password'),
                'departmentID' => $academicDept->departmentID,
                'userRolesID' => $reviewerRole->userRoleID,
            ],
        ];

        foreach ($users as $userData) {
            // Check if user already exists by email
            $existingUser = User::where('email', $userData['email'])->first();
            
            if (!$existingUser) {
                User::create($userData);
            } else {
                $this->command->info("User with email {$userData['email']} already exists, skipping...");
            }
        }
    }
}

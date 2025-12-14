<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use App\Models\Department;
use App\Models\ResearchCenter;
use Illuminate\Support\Facades\Hash;

class TestAccountsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get roles
        $proponentRole = Role::where('userRole', 'Proponent')->first();
        $cmRole = Role::where('userRole', 'CM')->first();
        $rddRole = Role::where('userRole', 'RDD')->first();

        if (!$proponentRole || !$cmRole || !$rddRole) {
            $this->command->error('Required roles not found. Please run RoleSeeder first.');
            return;
        }

        // Get or create a department for CM (they need a research center)
        $department = Department::first();
        if (!$department) {
            $department = Department::create(['name' => 'Test Department']);
        }

        // Get or create a research center for CM
        $researchCenter = ResearchCenter::first();
        if (!$researchCenter) {
            $researchCenter = ResearchCenter::create([
                'name' => 'Test Research Center',
                'departmentID' => $department->departmentID
            ]);
        }

        // Create Proponent account
        User::updateOrCreate(
            ['email' => 'proponent@test.com'],
            [
                'firstName' => 'John',
                'lastName' => 'Proponent',
                'email' => 'proponent@test.com',
                'password' => Hash::make('password'),
                'userRolesID' => $proponentRole->userRoleID,
                'departmentID' => $department->departmentID,
                'status' => 'active'
            ]
        );

        // Create CM (Center Manager) account
        User::updateOrCreate(
            ['email' => 'cm@test.com'],
            [
                'firstName' => 'Jane',
                'lastName' => 'Center Manager',
                'email' => 'cm@test.com',
                'password' => Hash::make('password'),
                'userRolesID' => $cmRole->userRoleID,
                'departmentID' => $department->departmentID,
                'researchCenterID' => $researchCenter->centerID,
                'status' => 'active'
            ]
        );

        // Create RDD (Research & Development Division) account
        User::updateOrCreate(
            ['email' => 'rdd@test.com'],
            [
                'firstName' => 'Robert',
                'lastName' => 'RDD Manager',
                'email' => 'rdd@test.com',
                'password' => Hash::make('password'),
                'userRolesID' => $rddRole->userRoleID,
                'departmentID' => $department->departmentID,
                'status' => 'active'
            ]
        );

        $this->command->info('Test accounts created successfully!');
        $this->command->info('Proponent: proponent@test.com / password');
        $this->command->info('CM: cm@test.com / password');
        $this->command->info('RDD: rdd@test.com / password');
    }
}

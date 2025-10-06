<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Department;

class AddMissingCMUsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get College of Applied Economics
        $appliedEconomics = Department::where('name', 'College of Applied Economics')->first();
        
        if (!$appliedEconomics) {
            $this->command->error('College of Applied Economics not found!');
            return;
        }
        
        // Create CM users for College of Applied Economics
        $cmUsers = [
            [
                'firstName' => 'Dr. Maria',
                'lastName' => 'Santos',
                'email' => 'cm-economics@usep.edu.ph',
                'password' => bcrypt('password'),
                'departmentID' => $appliedEconomics->departmentID,
                'userRolesID' => 2
            ],
            [
                'firstName' => 'Dr. Jose',
                'lastName' => 'Reyes',
                'email' => 'cm-economics1@usep.edu.ph',
                'password' => bcrypt('password'),
                'departmentID' => $appliedEconomics->departmentID,
                'userRolesID' => 2
            ]
        ];
        
        foreach ($cmUsers as $userData) {
            User::create($userData);
            $this->command->info("Created CM user: {$userData['firstName']} {$userData['lastName']} ({$userData['email']}) for {$appliedEconomics->name}");
        }
        
        $this->command->info('Missing CM users added successfully.');
    }
}

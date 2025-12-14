<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Department;

class RedistributeCMUsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all CM users
        $cmUsers = User::where('userRolesID', 2)->get();
        
        // Get all college departments (excluding administrative departments)
        $collegeDepartments = Department::whereIn('name', [
            'College of Information and Computing',
            'College of Engineering',
            'College of Business Administration',
            'College of Education',
            'College of Arts and Sciences',
            'College of Technology',
            'College of Applied Economics'
        ])->get();
        
        // Define college email mappings
        $collegeEmailMappings = [
            'College of Information and Computing' => 'cm-cic@usep.edu.ph',
            'College of Engineering' => 'cm-engineering@usep.edu.ph',
            'College of Business Administration' => 'cm-business@usep.edu.ph',
            'College of Education' => 'cm-education@usep.edu.ph',
            'College of Arts and Sciences' => 'cm-arts@usep.edu.ph',
            'College of Technology' => 'cm-technology@usep.edu.ph',
            'College of Applied Economics' => 'cm-economics@usep.edu.ph'
        ];
        
        // Distribute CM users evenly across colleges
        $usersPerCollege = ceil($cmUsers->count() / $collegeDepartments->count());
        $collegeIndex = 0;
        $userCounter = 0;
        $usedEmails = [];
        
        foreach ($cmUsers as $user) {
            $department = $collegeDepartments[$collegeIndex];
            $baseEmail = $collegeEmailMappings[$department->name];
            
            // Update user's department
            $user->update(['departmentID' => $department->departmentID]);
            
            // Generate unique email
            $newEmail = $baseEmail;
            $counter = 1;
            while (in_array($newEmail, $usedEmails)) {
                $emailParts = explode('@', $baseEmail);
                $newEmail = $emailParts[0] . $counter . '@' . $emailParts[1];
                $counter++;
            }
            
            $usedEmails[] = $newEmail;
            $user->update(['email' => $newEmail]);
            
            $this->command->info("Assigned {$user->fullName} to {$department->name} with email {$newEmail}");
            
            $userCounter++;
            
            // Move to next college if we've assigned enough users to current college
            if ($userCounter >= $usersPerCollege) {
                $collegeIndex++;
                $userCounter = 0;
                
                // Reset to first college if we've gone through all colleges
                if ($collegeIndex >= $collegeDepartments->count()) {
                    $collegeIndex = 0;
                }
            }
        }
        
        $this->command->info('CM users redistributed across colleges successfully.');
    }
}

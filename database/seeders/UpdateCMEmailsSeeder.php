<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Department;

class UpdateCMEmailsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all CM users
        $cmUsers = User::where('userRolesID', 2)->get();
        
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
        
        // Group CM users by department
        $cmUsersByDepartment = $cmUsers->groupBy('departmentID');
        
        foreach ($cmUsersByDepartment as $departmentId => $users) {
            $department = Department::find($departmentId);
            
            if ($department && isset($collegeEmailMappings[$department->name])) {
                $newEmail = $collegeEmailMappings[$department->name];
                
                // Update the first CM user in each department to the new email
                $firstUser = $users->first();
                if ($firstUser) {
                    $firstUser->update(['email' => $newEmail]);
                    $this->command->info("Updated {$firstUser->fullName} to {$newEmail} for {$department->name}");
                }
                
                // For additional CM users in the same department, add a number suffix
                $additionalUsers = $users->skip(1);
                $counter = 2;
                foreach ($additionalUsers as $user) {
                    $emailParts = explode('@', $newEmail);
                    $newEmailWithNumber = $emailParts[0] . $counter . '@' . $emailParts[1];
                    $user->update(['email' => $newEmailWithNumber]);
                    $this->command->info("Updated {$user->fullName} to {$newEmailWithNumber} for {$department->name}");
                    $counter++;
                }
            }
        }
        
        $this->command->info('CM email addresses updated successfully.');
    }
}

<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Department;

class FixUserDepartmentAssignmentsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get departments
        $officeOfPresident = Department::where('name', 'Office of the President')->first();
        $rdd = Department::where('name', 'Research and Development Division')->first();
        $academicAffairs = Department::where('name', 'Academic Affairs')->first();
        $studentAffairs = Department::where('name', 'Office of Student Affairs and University Relations Unit')->first();
        $it = Department::where('name', 'Information Technology')->first();
        
        // Get college departments
        $colleges = Department::whereIn('name', [
            'College of Information and Computing',
            'College of Engineering',
            'College of Business Administration',
            'College of Education',
            'College of Arts and Sciences',
            'College of Technology',
            'College of Applied Economics'
        ])->get();

        // Fix OP users - they should all be in Office of the President
        $opUsers = User::where('userRolesID', 4)->get();
        foreach ($opUsers as $user) {
            if ($user->departmentID != $officeOfPresident->departmentID) {
                $user->update(['departmentID' => $officeOfPresident->departmentID]);
                $this->command->info("Fixed OP user {$user->fullName} to Office of the President");
            }
        }

        // Fix RDD users - they should be in Research and Development Division
        $rddUsers = User::where('userRolesID', 1)->get();
        foreach ($rddUsers as $user) {
            if ($user->departmentID != $rdd->departmentID) {
                $user->update(['departmentID' => $rdd->departmentID]);
                $this->command->info("Fixed RDD user {$user->fullName} to Research and Development Division");
            }
        }

        // Fix Admin users - they should be in Information Technology
        $adminUsers = User::where('userRolesID', 6)->get();
        foreach ($adminUsers as $user) {
            if ($user->departmentID != $it->departmentID) {
                $user->update(['departmentID' => $it->departmentID]);
                $this->command->info("Fixed Admin user {$user->fullName} to Information Technology");
            }
        }

        // Fix OSUORU users - they should be in Office of Student Affairs
        $osuurUsers = User::where('userRolesID', 5)->get();
        foreach ($osuurUsers as $user) {
            if ($user->departmentID != $studentAffairs->departmentID) {
                $user->update(['departmentID' => $studentAffairs->departmentID]);
                $this->command->info("Fixed OSUORU user {$user->fullName} to Office of Student Affairs");
            }
        }

        // Redistribute Proponent users across colleges (they should be in colleges, not CIC only)
        $proponentUsers = User::where('userRolesID', 3)->get();
        $collegeIndex = 0;
        
        foreach ($proponentUsers as $user) {
            // Skip if already in a college
            if ($colleges->contains('departmentID', $user->departmentID)) {
                continue;
            }
            
            // Assign to next college
            $college = $colleges[$collegeIndex % $colleges->count()];
            $user->update(['departmentID' => $college->departmentID]);
            $this->command->info("Assigned Proponent {$user->fullName} to {$college->name}");
            $collegeIndex++;
        }

        // Redistribute Reviewer users across colleges (they should be in colleges, not CIC only)
        $reviewerUsers = User::where('userRolesID', 7)->get();
        $collegeIndex = 0;
        
        foreach ($reviewerUsers as $user) {
            // Skip if already in a college
            if ($colleges->contains('departmentID', $user->departmentID)) {
                continue;
            }
            
            // Assign to next college
            $college = $colleges[$collegeIndex % $colleges->count()];
            $user->update(['departmentID' => $college->departmentID]);
            $this->command->info("Assigned Reviewer {$user->fullName} to {$college->name}");
            $collegeIndex++;
        }

        $this->command->info('User department assignments fixed successfully.');
    }
}

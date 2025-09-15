<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Department;

class AssignUserDepartmentsSeeder extends Seeder
{
    public function run()
    {
        // Get departments
        $rdd = Department::where('name', 'Research and Development Division')->first();
        $medicine = Department::where('name', 'College of Medicine')->first();
        $president = Department::where('name', 'Office of the President')->first();
        $studentAffairs = Department::where('name', 'Office of Student Affairs and University Relations Unit')->first();
        $academic = Department::where('name', 'Academic Affairs')->first();
        $it = Department::where('name', 'Information Technology')->first();

        // Assign departments to users based on their roles
        $users = [
            'admin@usep.edu.ph' => $it, // Admin - IT Department
            'rdd@usep.edu.ph' => $rdd, // RDD - Research and Development Division
            'cm@usep.edu.ph' => $medicine, // CM - College of Medicine
            'cm-academic@usep.edu.ph' => $academic, // CM (Center Manager) - Academic Affairs (same as proponent)
            'proponent@usep.edu.ph' => $academic, // Proponent - Academic Affairs
            'op@usep.edu.ph' => $president, // OP - Office of the President
            'osuur@usep.edu.ph' => $studentAffairs, // OSUORU - Office of Student Affairs
            'reviewer@usep.edu.ph' => $medicine, // Reviewer - College of Medicine
        ];

        foreach ($users as $email => $department) {
            $user = User::where('email', $email)->first();
            if ($user && $department) {
                $user->update(['departmentID' => $department->departmentID]);
                $this->command->info("Assigned {$user->fullName} to {$department->name}");
            }
        }

        $this->command->info('User departments assigned successfully.');
    }
}

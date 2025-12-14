<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Department;

class DepartmentSeeder extends Seeder
{
    public function run()
    {
        $departments = [
            // Administrative Departments
            'Office of the President',
            'Research and Development Division',
            'Academic Affairs',
            'Office of Student Affairs and University Relations Unit',
            'Finance Department',
            'Human Resources',
            'Information Technology',
            
            // Academic Colleges (Updated names)
            'College of Information and Computing',
            'College of Engineering',
            'College of Business Administration',
            'College of Education',
            'College of Arts and Sciences',
            'College of Technology',
            'College of Applied Economics'
        ];

        // Update existing departments or create new ones
        foreach ($departments as $index => $departmentName) {
            $departmentId = $index + 1;
            Department::updateOrCreate(
                ['departmentID' => $departmentId],
                ['name' => $departmentName]
            );
        }
        
        $this->command->info('Updated ' . count($departments) . ' departments.');
    }
}

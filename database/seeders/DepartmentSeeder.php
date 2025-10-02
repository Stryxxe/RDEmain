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
            
            // Academic Colleges and Centers
            'College of Medicine',
            'College of Engineering',
            'College of Education',
            'College of Arts and Sciences',
            'College of Business Administration',
            'College of Agriculture',
            'College of Nursing',
            'College of Computer Studies',
            
            // Research Centers
            'Center for Information and Communications Technology',
            'Center for Environmental Studies and Research',
            'Center for Indigenous Studies and Cultural Heritage',
            'Center for Renewable Energy and Sustainability',
            'Center for Health Informatics and Telemedicine',
            'Center for Tourism and Hospitality Studies',
            'Center for Disaster Risk Reduction and Management',
            'Center for Water Resources and Environmental Engineering',
            'Center for Community Development and Social Services',
            'Center for Educational Technology and Innovation',
            'Center for Cultural Studies and Heritage Preservation',
            'Center for Telemedicine and Digital Health',
            'Center for Public Health and Nutrition',
            'Center for Materials Science and Engineering',
            'Center for Agricultural Research and Development',
            'Center for Marine Biology and Oceanography',
            'Center for Urban Planning and Development',
            'Center for Digital Innovation and Technology',
            'Center for Social Sciences and Humanities Research',
            'Center for Sustainable Development Studies'
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

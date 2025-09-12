<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Department;

class DepartmentSeeder extends Seeder
{
    public function run()
    {
        $departments = [
            'Research and Development Division',
            'College of Medicine',
            'Office of the President',
            'Office of Student Affairs and University Relations Unit',
            'Academic Affairs',
            'Finance Department',
            'Human Resources',
            'Information Technology',
            'Student Services'
        ];

        foreach ($departments as $department) {
            Department::create(['name' => $department]);
        }
    }
}

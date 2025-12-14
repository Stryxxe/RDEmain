<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Department;
use App\Models\ResearchCenter;

class ResearchCenterSeeder extends Seeder
{
    public function run(): void
    {
        // Map of Research Centers to Department names for linkage
        $centers = [
            'Center for Information and Communications Technology' => 'ICT Department',
            'Center for Education Research' => 'Education Department',
            'Center for Agriculture and Natural Resources' => 'Agriculture Department',
            'Center for Health and Allied Sciences' => 'Health Sciences Department',
            'Center for Engineering and Technology' => 'Engineering Department',
        ];

        foreach ($centers as $centerName => $deptName) {
            // Attempt to find department by either `name` or `departmentName`
            $department = Department::query()
                ->where('name', $deptName)
                ->orWhere('departmentName', $deptName)
                ->first();

            ResearchCenter::updateOrCreate(
                ['name' => $centerName],
                ['departmentID' => $department?->departmentID]
            );
        }
    }
}

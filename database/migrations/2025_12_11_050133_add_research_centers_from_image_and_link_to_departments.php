<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First, ensure all departments from the image exist
        $departmentsToAdd = [
            'College of Agriculture and Related Sciences',
            'College of Development Management',
            'College of Teacher Education and Technology',
            'School of Law',
            'School of Medicine',
        ];

        foreach ($departmentsToAdd as $deptName) {
            DB::table('departments')->updateOrInsert(
                ['name' => $deptName],
                [
                    'name' => $deptName,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        // Map departments to their research centers based on the image
        // Using exact names from the image
        $departmentResearchCenterMap = [
            'College of Agriculture and Related Sciences' => 'Agricultural Research, Technology and Innovation Center (ARTIC)',
            'College of Applied Economics' => 'Socio-Economic Research and Data Analytics Center Mindanao (SERDAC)',
            'College of Arts and Sciences' => 'Research and Development Center for Arts and Sciences (RDCAS)',
            'College of Business Administration' => 'Center for Research in Entrepreneurship and Enterprise Development (CREED)',
            'College of Development Management' => 'Mindanao Center for Policy Studies (MCPS)',
            'College of Education' => 'Mindanao Center for Education Research, Training and Innovation (MCERTI)',
            'College of Engineering' => 'Geospatial, IOT, Solutions and Technology-Engineering Research Center (GIST-ERC)',
            'College of Information and Computing' => 'Mindanao Center for Informatics and Intelligent Systems (M-CIIS)',
            'College of Teacher Education and Technology' => 'Center for Technology Supported Learning (CTSuL)',
            'College of Technology' => 'Center for Research and Innovations in Industrial Technology (CRIIT)',
            'School of Law' => 'Mindanao Law and Peace Resource Institute (MiLawPRI)',
            'School of Medicine' => 'School of Medicine Research Unit',
        ];

        // Add research centers and link them to departments
        foreach ($departmentResearchCenterMap as $deptName => $centerName) {
            // Get the department ID
            $department = DB::table('departments')->where('name', $deptName)->first();
            
            if ($department) {
                // Insert or update the research center
                DB::table('research_centers')->updateOrInsert(
                    ['name' => $centerName],
                    [
                        'name' => $centerName,
                        'departmentID' => $department->departmentID,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]
                );
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove the research centers added by this migration
        $researchCentersToRemove = [
            'Agricultural Research, Technology and Innovation Center (ARTIC)',
            'Socio-Economic Research and Data Analytics Center Mindanao (SERDAC)',
            'Research and Development Center for Arts and Sciences (RDCAS)',
            'Center for Research in Entrepreneurship and Enterprise Development (CREED)',
            'Mindanao Center for Policy Studies (MCPS)',
            'Mindanao Center for Education Research, Training and Innovation (MCERTI)',
            'Geospatial, IOT, Solutions and Technology-Engineering Research Center (GIST-ERC)',
            'Mindanao Center for Informatics and Intelligent Systems (M-CIIS)',
            'Center for Technology Supported Learning (CTSuL)',
            'Center for Research and Innovations in Industrial Technology (CRIIT)',
            'Mindanao Law and Peace Resource Institute (MiLawPRI)',
            'School of Medicine Research Unit',
        ];

        DB::table('research_centers')->whereIn('name', $researchCentersToRemove)->delete();

        // Optionally remove the departments that were added (if they don't have users)
        $departmentsToRemove = [
            'College of Agriculture and Related Sciences',
            'College of Development Management',
            'College of Teacher Education and Technology',
            'School of Law',
            'School of Medicine',
        ];

        // Only remove if no users are assigned to these departments
        foreach ($departmentsToRemove as $deptName) {
            $dept = DB::table('departments')->where('name', $deptName)->first();
            if ($dept) {
                $userCount = DB::table('users')->where('departmentID', $dept->departmentID)->count();
                if ($userCount === 0) {
                    DB::table('departments')->where('departmentID', $dept->departmentID)->delete();
                }
            }
        }
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Remove old research centers and departments that are no longer needed
        $departmentsToRemove = [
            'College of Computer Studies', // Not in new list
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

        // First, update users assigned to these departments to CIC
        $cic = \DB::table('departments')->where('name', 'College of Information and Computing')->first();
        if ($cic) {
            \DB::table('users')
                ->whereIn('departmentID', function($query) use ($departmentsToRemove) {
                    $query->select('departmentID')
                          ->from('departments')
                          ->whereIn('name', $departmentsToRemove);
                })
                ->update(['departmentID' => $cic->departmentID]);
        }

        // Then remove the departments
        \DB::table('departments')->whereIn('name', $departmentsToRemove)->delete();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This migration removes data, so we can't easily reverse it
        // The departments would need to be recreated manually if needed
    }
};

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
        // Add new research centers as departments
        $researchCenters = [
            'Center for Agricultural Research',
            'Center for Environmental Studies', 
            'Center for Health Sciences',
            'Center for Engineering Research',
            'Center for Social Sciences',
            'Center for Business and Economics',
            'Center for Technology Innovation',
            'Center for Research and Development'
        ];

        foreach ($researchCenters as $center) {
            \DB::table('departments')->insert([
                'name' => $center,
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove the research centers that were added
        $researchCenters = [
            'Center for Agricultural Research',
            'Center for Environmental Studies', 
            'Center for Health Sciences',
            'Center for Engineering Research',
            'Center for Social Sciences',
            'Center for Business and Economics',
            'Center for Technology Innovation',
            'Center for Research and Development'
        ];

        \DB::table('departments')->whereIn('name', $researchCenters)->delete();
    }
};

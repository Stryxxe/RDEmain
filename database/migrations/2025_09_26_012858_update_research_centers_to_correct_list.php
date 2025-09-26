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
        // Remove all existing research centers (keep only original departments)
        $researchCentersToRemove = [
            'Center for Agricultural Research',
            'Center for Environmental Studies', 
            'Center for Health Sciences',
            'Center for Engineering Research',
            'Center for Social Sciences',
            'Center for Business and Economics',
            'Center for Technology Innovation',
            'Center for Research and Development'
        ];

        \DB::table('departments')->whereIn('name', $researchCentersToRemove)->delete();

        // Add the correct research centers from the image
        $correctResearchCenters = [
            'Agricultural Research, Technology, and Innovation Center',
            'Center for Research in Entrepreneurship and Enterprise Development',
            'Center for Research and Innovations in Industrial Technology',
            'Center for Technology-Supported Learning',
            'Geospatial, IOT, Solutions and Technology',
            'Mindanao Center for Educational Research, Training and Innovation',
            'Mindanao Center for Informatics and Intelligent Systems',
            'Mindanao Center for Policy Studies',
            'Mindanao Law and Peace Resource Institute',
            'Research and Development Center for Arts and Sciences',
            'Socio-economic Research and Data Analytics Center Mindanao'
        ];

        foreach ($correctResearchCenters as $center) {
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
        // Remove the correct research centers and restore the old ones
        $correctResearchCenters = [
            'Agricultural Research, Technology, and Innovation Center',
            'Center for Research in Entrepreneurship and Enterprise Development',
            'Center for Research and Innovations in Industrial Technology',
            'Center for Technology-Supported Learning',
            'Geospatial, IOT, Solutions and Technology',
            'Mindanao Center for Educational Research, Training and Innovation',
            'Mindanao Center for Informatics and Intelligent Systems',
            'Mindanao Center for Policy Studies',
            'Mindanao Law and Peace Resource Institute',
            'Research and Development Center for Arts and Sciences',
            'Socio-economic Research and Data Analytics Center Mindanao'
        ];

        \DB::table('departments')->whereIn('name', $correctResearchCenters)->delete();

        // Restore the old research centers
        $oldResearchCenters = [
            'Center for Agricultural Research',
            'Center for Environmental Studies', 
            'Center for Health Sciences',
            'Center for Engineering Research',
            'Center for Social Sciences',
            'Center for Business and Economics',
            'Center for Technology Innovation',
            'Center for Research and Development'
        ];

        foreach ($oldResearchCenters as $center) {
            \DB::table('departments')->insert([
                'name' => $center,
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }
    }
};

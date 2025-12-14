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
        Schema::table('progress_reports', function (Blueprint $table) {
            // researchCenterID references centerID (the primary key in research_centers table)
            // departmentID references departmentID (the primary key in departments table)
            $table->unsignedBigInteger('researchCenterID')->nullable()->after('userID');
            $table->unsignedBigInteger('departmentID')->nullable()->after('researchCenterID');
            
            // Add foreign key constraints
            $table->foreign('researchCenterID')->references('centerID')->on('research_centers')->onDelete('set null');
            $table->foreign('departmentID')->references('departmentID')->on('departments')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('progress_reports', function (Blueprint $table) {
            $table->dropColumn(['researchCenterID', 'departmentID']);
        });
    }
};

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
    public function up()
    {
        Schema::create('timeline_stages', function (Blueprint $table) {
            $table->id('stageID');
            $table->string('stageName', 100);
            $table->text('stageDescription')->nullable();
            $table->integer('orderIndex')->default(0); // For ordering stages
            $table->foreignId('statusID')->nullable()->constrained('status', 'statusID')->onDelete('set null');
            $table->boolean('isActive')->default(true); // To enable/disable stages
            $table->string('icon')->nullable(); // Optional icon identifier
            $table->string('color')->default('gray'); // Color theme: blue, green, red, etc.
            $table->timestamps();
        });

        // Insert default timeline stages matching current implementation
        DB::table('timeline_stages')->insert([
            [
                'stageName' => 'Proposal Submitted',
                'stageDescription' => 'Research proposal has been submitted to the system',
                'orderIndex' => 1,
                'statusID' => 2, // Submitted status
                'isActive' => true,
                'color' => 'green',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'stageName' => 'College Endorsement',
                'stageDescription' => 'Waiting for college/department endorsement',
                'orderIndex' => 2,
                'statusID' => 3, // Under Review status
                'isActive' => true,
                'color' => 'blue',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'stageName' => 'R&D Division',
                'stageDescription' => 'Under review by Research and Development Division',
                'orderIndex' => 3,
                'statusID' => 3, // Under Review status
                'isActive' => true,
                'color' => 'blue',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'stageName' => 'Proposal Review',
                'stageDescription' => 'Comprehensive proposal review by committee',
                'orderIndex' => 4,
                'statusID' => 3, // Under Review status
                'isActive' => true,
                'color' => 'blue',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'stageName' => 'Ethics Review',
                'stageDescription' => 'Ethics committee review and approval',
                'orderIndex' => 5,
                'statusID' => 3, // Under Review status
                'isActive' => true,
                'color' => 'purple',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'stageName' => 'OVPRDE',
                'stageDescription' => 'Office of the Vice President for Research and Development Extension review',
                'orderIndex' => 6,
                'statusID' => 3, // Under Review status
                'isActive' => true,
                'color' => 'indigo',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'stageName' => 'President',
                'stageDescription' => 'Final approval by University President',
                'orderIndex' => 7,
                'statusID' => 5, // Approved status
                'isActive' => true,
                'color' => 'yellow',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'stageName' => 'OSOURU',
                'stageDescription' => 'Office of Strategic Operations for University Research Units processing',
                'orderIndex' => 8,
                'statusID' => 5, // Approved status
                'isActive' => true,
                'color' => 'orange',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'stageName' => 'Implementation',
                'stageDescription' => 'Project implementation phase',
                'orderIndex' => 9,
                'statusID' => 5, // Approved status
                'isActive' => true,
                'color' => 'green',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'stageName' => 'Monitoring',
                'stageDescription' => 'Ongoing project monitoring and evaluation',
                'orderIndex' => 10,
                'statusID' => 4, // Ongoing status (you may need to adjust)
                'isActive' => true,
                'color' => 'cyan',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'stageName' => 'For Completion',
                'stageDescription' => 'Final project completion and documentation',
                'orderIndex' => 11,
                'statusID' => null, // Special stage
                'isActive' => true,
                'color' => 'green',
                'created_at' => now(),
                'updated_at' => now()
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('timeline_stages');
    }
};

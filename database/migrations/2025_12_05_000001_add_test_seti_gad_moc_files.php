<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Create test SETI, GAD, and MOC files for an existing proposal (if it exists)
        $proposalID = 1; // The proposal that currently exists
        
        // Only add if the proposal exists
        if (DB::table('proposals')->where('proposalID', $proposalID)->exists()) {
            // Add SETI Scorecard
            DB::table('files')->insert([
                'proposalID' => $proposalID,
                'fileName' => 'SETI_Scorecard.pdf',
                'filePath' => 'proposals/1/SETI_Scorecard.pdf',
                'fileType' => 'seti_scorecard',
                'fileSize' => 102400,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Add GAD Certificate
            DB::table('files')->insert([
                'proposalID' => $proposalID,
                'fileName' => 'GAD_Certificate.pdf',
                'filePath' => 'proposals/1/GAD_Certificate.pdf',
                'fileType' => 'gad_certificate',
                'fileSize' => 102400,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Add Matrix of Compliance
            DB::table('files')->insert([
                'proposalID' => $proposalID,
                'fileName' => 'Matrix_Compliance.pdf',
                'filePath' => 'proposals/1/Matrix_Compliance.pdf',
                'fileType' => 'matrix_compliance',
                'fileSize' => 102400,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove the test files
        DB::table('files')
            ->where('proposalID', 1)
            ->whereIn('fileType', ['seti_scorecard', 'gad_certificate', 'matrix_compliance'])
            ->delete();
    }
};

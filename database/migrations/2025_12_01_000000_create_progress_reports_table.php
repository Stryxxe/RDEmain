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
        Schema::create('progress_reports', function (Blueprint $table) {
            $table->id('reportID');
            $table->foreignId('proposalID')->constrained('proposals', 'proposalID');
            $table->foreignId('userID')->constrained('users', 'userID');
            $table->string('reportType'); // Quarterly, Annual, Final, Interim
            $table->string('reportPeriod'); // e.g., Q1 2025, 2025
            $table->integer('progressPercentage')->default(0);
            $table->decimal('budgetUtilized', 15, 2)->nullable();
            $table->text('achievements')->nullable();
            $table->text('challenges')->nullable();
            $table->text('nextMilestone')->nullable();
            $table->text('additionalNotes')->nullable();
            $table->timestamp('submittedAt')->useCurrent();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('progress_reports');
    }
};






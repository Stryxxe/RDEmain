<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
        {
            Schema::create('proposals', function (Blueprint $table) {
                $table->id('proposalID');
                $table->string('researchTitle');
                $table->text('description')->nullable();
                $table->text('objectives')->nullable();
                $table->string('researchCenter')->nullable();
                $table->json('researchAgenda')->nullable();
                $table->json('dostSPs')->nullable();
                $table->json('sustainableDevelopmentGoals')->nullable();
                $table->decimal('proposedBudget', 15, 2)->nullable();
                $table->string('revisionFile')->nullable();
                $table->json('matrixOfCompliance')->nullable();
                $table->timestamp('uploadedAt')->useCurrent();
                $table->foreignId('statusID')->constrained('status', 'statusID');
                $table->foreignId('userID')->constrained('users', 'userID');
                $table->timestamps();
            });
        }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('proposals');
    }
};

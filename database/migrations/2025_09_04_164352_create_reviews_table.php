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
            Schema::create('reviews', function (Blueprint $table) {
                $table->id('reviewID');
                $table->text('remarks')->nullable();
                $table->json('matrixOfCompliance')->nullable();
                $table->timestamp('reviewedAt')->useCurrent();
                $table->foreignId('proposalID')->constrained('proposals', 'proposalID');
                $table->foreignId('reviewerID')->constrained('users', 'userID');
                $table->foreignId('decisionID')->constrained('review_decisions', 'decisionID');
                $table->timestamps();
            });
        }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};

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
        Schema::create('decisions', function (Blueprint $table) {
            $table->id('decisionID');
            $table->foreignId('proposalID')->constrained('proposals', 'proposalID');
            $table->foreignId('decisionMakerID')->constrained('users', 'userID');
            $table->string('decisionType', 50);
            $table->text('decisionComments')->nullable();
            $table->timestamp('decisionDate')->useCurrent();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('decisions');
    }
};

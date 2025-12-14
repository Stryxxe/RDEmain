<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('proposal_proponents', function (Blueprint $table) {
            $table->id('id');
            $table->foreignId('proposalID')->constrained('proposals', 'proposalID')->onDelete('cascade');
            $table->foreignId('userID')->constrained('users', 'userID')->onDelete('cascade');
            $table->timestamps();
            $table->unique(['proposalID', 'userID']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('proposal_proponents');
    }
};

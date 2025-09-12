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

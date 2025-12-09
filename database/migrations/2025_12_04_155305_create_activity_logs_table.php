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
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id('activityID');
            $table->unsignedBigInteger('userID');
            $table->string('action', 100); // e.g., 'created', 'updated', 'deleted'
            $table->string('entity_type', 100); // e.g., 'user', 'department', 'setting'
            $table->unsignedBigInteger('entity_id')->nullable(); // ID of the affected entity
            $table->text('description'); // Human-readable description
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();

            $table->foreign('userID')->references('userID')->on('users')->onDelete('cascade');
            $table->index(['userID', 'created_at']);
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};

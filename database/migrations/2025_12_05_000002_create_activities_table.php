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
        Schema::create('activities', function (Blueprint $table) {
            $table->id('activityID');
            $table->unsignedBigInteger('userID')->nullable();
            $table->string('action'); // 'create', 'update', 'delete', 'login', etc.
            $table->string('description');
            $table->string('model_type')->nullable(); // 'User', 'Proposal', 'Department', etc.
            $table->unsignedBigInteger('model_id')->nullable();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();

            $table->foreign('userID')
                ->references('userID')
                ->on('users')
                ->onDelete('set null');

            $table->index('userID');
            $table->index('action');
            $table->index('model_type');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activities');
    }
};

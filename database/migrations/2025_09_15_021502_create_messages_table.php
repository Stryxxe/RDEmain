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
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('senderID');
            $table->unsignedBigInteger('recipientID');
            $table->string('subject');
            $table->text('content');
            $table->string('type')->default('general'); // 'general', 'proposal_update', 'system'
            $table->boolean('read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            
            $table->foreign('senderID')->references('userID')->on('users')->onDelete('cascade');
            $table->foreign('recipientID')->references('userID')->on('users')->onDelete('cascade');
            $table->index(['recipientID', 'read']);
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};

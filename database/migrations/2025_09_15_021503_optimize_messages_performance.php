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
        Schema::table('messages', function (Blueprint $table) {
            // Add composite indexes for better CM filtering performance
            $table->index(['senderID', 'recipientID', 'created_at'], 'messages_sender_recipient_created_idx');
            $table->index(['recipientID', 'senderID', 'created_at'], 'messages_recipient_sender_created_idx');
            $table->index(['recipientID', 'read', 'created_at'], 'messages_recipient_read_created_idx');
            $table->index(['senderID', 'read', 'created_at'], 'messages_sender_read_created_idx');
        });

        Schema::table('users', function (Blueprint $table) {
            // Add index for department filtering
            $table->index(['departmentID', 'userRolesID'], 'users_department_role_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex('messages_sender_recipient_created_idx');
            $table->dropIndex('messages_recipient_sender_created_idx');
            $table->dropIndex('messages_recipient_read_created_idx');
            $table->dropIndex('messages_sender_read_created_idx');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_department_role_idx');
        });
    }
};

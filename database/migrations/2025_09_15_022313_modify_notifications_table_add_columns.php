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
        Schema::table('notifications', function (Blueprint $table) {
            // All columns already exist in the original table, so this migration is not needed
            // The original create_notifications_table migration already includes all these columns
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropForeign(['userID']);
            $table->dropIndex(['userID', 'read']);
            $table->dropIndex(['created_at']);
            $table->dropColumn(['userID', 'type', 'title', 'message', 'data', 'read', 'read_at']);
        });
    }
};

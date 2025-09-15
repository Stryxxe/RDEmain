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
            // Only add columns that don't already exist
            if (!Schema::hasColumn('notifications', 'userID')) {
                $table->unsignedBigInteger('userID')->after('id');
            }
            if (!Schema::hasColumn('notifications', 'type')) {
                $table->string('type')->after('userID');
            }
            if (!Schema::hasColumn('notifications', 'title')) {
                $table->string('title')->after('type');
            }
            if (!Schema::hasColumn('notifications', 'message')) {
                $table->text('message')->after('title');
            }
            if (!Schema::hasColumn('notifications', 'data')) {
                $table->json('data')->nullable()->after('message');
            }
            if (!Schema::hasColumn('notifications', 'read')) {
                $table->boolean('read')->default(false)->after('data');
            }
            if (!Schema::hasColumn('notifications', 'read_at')) {
                $table->timestamp('read_at')->nullable()->after('read');
            }
            
            // Add foreign key and indexes if they don't exist
            if (!Schema::hasColumn('notifications', 'userID')) {
                $table->foreign('userID')->references('userID')->on('users')->onDelete('cascade');
                $table->index(['userID', 'read']);
                $table->index('created_at');
            }
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

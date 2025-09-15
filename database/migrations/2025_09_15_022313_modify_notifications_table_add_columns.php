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
            $table->unsignedBigInteger('userID')->after('id');
            $table->string('type')->after('userID');
            $table->string('title')->after('type');
            $table->text('message')->after('title');
            $table->json('data')->nullable()->after('message');
            $table->boolean('read')->default(false)->after('data');
            $table->timestamp('read_at')->nullable()->after('read');
            
            $table->foreign('userID')->references('userID')->on('users')->onDelete('cascade');
            $table->index(['userID', 'read']);
            $table->index('created_at');
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

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
        Schema::table('endorsements', function (Blueprint $table) {
            $table->foreignId('endorserID')->constrained('users', 'userID')->after('proposalID');
            $table->text('endorsementComments')->nullable()->after('endorserID');
            $table->string('endorsementStatus')->default('pending')->after('endorsementComments');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('endorsements', function (Blueprint $table) {
            $table->dropForeign(['endorserID']);
            $table->dropColumn(['endorserID', 'endorsementComments', 'endorsementStatus']);
        });
    }
};
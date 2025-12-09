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
        // Note: SQLite doesn't support dropping foreign keys directly
        // We need to check if there's a constraint and handle it
        Schema::table('progress_reports', function (Blueprint $table) {
            // SQLite doesn't support dropping foreign keys in the usual way
            // The proposalID can now be null for CM submissions
            // We don't add a new constraint since proposals are optional for CM reports
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};

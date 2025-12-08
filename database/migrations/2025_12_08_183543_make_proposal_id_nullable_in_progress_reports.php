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
        Schema::table('progress_reports', function (Blueprint $table) {
            $table->unsignedBigInteger('proposalID')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('progress_reports', function (Blueprint $table) {
            $table->unsignedBigInteger('proposalID')->nullable(false)->change();
        });
    }
};

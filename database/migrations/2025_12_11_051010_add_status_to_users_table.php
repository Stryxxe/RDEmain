<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Check if status column already exists
        if (!Schema::hasColumn('users', 'status')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('status', 20)->default('pending')->after('userRolesID');
            });
        }

        // Set existing users to 'active' if they don't have a status
        DB::table('users')->whereNull('status')->update(['status' => 'active']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('users', 'status')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('status');
            });
        }
    }
};

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
        Schema::table('proposal_proponents', function (Blueprint $table) {
            $table->foreignId('projectRoleID')->nullable()->after('userID')->constrained('project_roles', 'projectRoleID')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('proposal_proponents', function (Blueprint $table) {
            $table->dropForeign(['projectRoleID']);
            $table->dropColumn('projectRoleID');
        });
    }
};

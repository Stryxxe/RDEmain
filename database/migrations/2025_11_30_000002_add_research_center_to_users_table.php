<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('researchCenterID')->nullable()->after('departmentID');
            
            $table->foreign('researchCenterID')
                ->references('centerID')->on('research_centers')
                ->onUpdate('cascade')
                ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['researchCenterID']);
            $table->dropColumn('researchCenterID');
        });
    }
};

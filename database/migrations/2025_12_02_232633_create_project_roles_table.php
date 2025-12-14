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
        Schema::create('project_roles', function (Blueprint $table) {
            $table->id('projectRoleID');
            $table->string('roleName', 100);
            $table->boolean('isActive')->default(true);
            $table->timestamps();
        });

        // Insert default project roles
        DB::table('project_roles')->insert([
            ['roleName' => 'Principal Investigator', 'isActive' => true, 'created_at' => now(), 'updated_at' => now()],
            ['roleName' => 'Co-Investigator', 'isActive' => true, 'created_at' => now(), 'updated_at' => now()],
            ['roleName' => 'Research Assistant', 'isActive' => true, 'created_at' => now(), 'updated_at' => now()],
            ['roleName' => 'Data Analyst', 'isActive' => true, 'created_at' => now(), 'updated_at' => now()],
            ['roleName' => 'Project Coordinator', 'isActive' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_roles');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
        {
            Schema::create('users', function (Blueprint $table) {
                $table->id('userID');
                $table->string('firstName', 50);
                $table->string('lastName', 50);
                $table->string('email', 50)->unique();
                $table->string('password');
                $table->foreignId('departmentID')->constrained('departments', 'departmentID');
                $table->foreignId('userRolesID')->constrained('user_roles', 'userRoleID');
                $table->rememberToken();
                $table->timestamps();
            });
        }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};

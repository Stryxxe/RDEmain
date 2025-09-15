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
            Schema::create('user_roles', function (Blueprint $table) {
                $table->id('userRoleID');
                $table->string('userRole', 50);
                $table->timestamps();
            });
            
            // Insert default roles
            DB::table('user_roles')->insert([
                ['userRole' => 'RDD'],
                ['userRole' => 'CM'],
                ['userRole' => 'Proponent'],
                ['userRole' => 'OP'],
                ['userRole' => 'OSUORU'],
                ['userRole' => 'Admin'],
                ['userRole' => 'Reviewer']
            ]);
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};

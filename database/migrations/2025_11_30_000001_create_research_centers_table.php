<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('research_centers', function (Blueprint $table) {
            $table->id('centerID');
            $table->string('name');
            $table->unsignedBigInteger('departmentID')->nullable();
            $table->timestamps();

            $table->foreign('departmentID')
                ->references('departmentID')->on('departments')
                ->onUpdate('cascade')
                ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('research_centers');
    }
};

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
        Schema::create('email_templates', function (Blueprint $table) {
            $table->id('templateID');
            $table->string('templateType')->unique(); // account-activated, password-reset, etc.
            $table->string('subject')->default('');
            $table->longText('body')->default('');
            $table->text('description')->nullable();
            $table->boolean('isActive')->default(true);
            $table->json('variables')->nullable(); // Variables available for this template like {user_name}, {email}
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('email_templates');
    }
};

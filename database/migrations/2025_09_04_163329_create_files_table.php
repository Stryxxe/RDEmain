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
            Schema::create('files', function (Blueprint $table) {
                $table->id('fileID');
                $table->string('fileName');
                $table->string('filePath');
                $table->string('fileType', 25);
                $table->bigInteger('fileSize')->nullable();
                $table->timestamp('uploadedAt')->useCurrent();
                $table->unsignedBigInteger('proposalID')->nullable();
                $table->foreign('proposalID')->references('proposalID')->on('proposals')->nullOnDelete();
                $table->timestamps();
            });
        }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('files');
    }
};

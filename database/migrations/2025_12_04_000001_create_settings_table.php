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
        Schema::create('settings', function (Blueprint $table) {
            $table->id('settingID');
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('type')->default('string'); // string, integer, boolean, json
            $table->timestamps();
        });

        // Insert default settings
        DB::table('settings')->insert([
            [
                'key' => 'allowed_file_types',
                'value' => '.pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg',
                'type' => 'string',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'max_file_size',
                'value' => '20',
                'type' => 'integer',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};

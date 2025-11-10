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
    public function up()
        {
            Schema::create('review_decisions', function (Blueprint $table) {
                $table->id('decisionID');
                $table->string('decision', 50);
                $table->timestamps();
            });
            
            // Insert default decisions
            DB::table('review_decisions')->insert([
                ['decision' => 'Approved'],
                ['decision' => 'Rejected'],
                ['decision' => 'Revisions Required']
            ]);
        }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('review_decisions');
    }
};

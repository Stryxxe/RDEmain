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
            Schema::create('status', function (Blueprint $table) {
                $table->id('statusID');
                $table->string('statusName', 50);
                $table->text('statusDescription')->nullable();
                $table->timestamps();
            });
            
            // Insert default statuses
            DB::table('status')->insert([
                ['statusName' => 'Draft', 'statusDescription' => 'Proposal is in draft stage'],
                ['statusName' => 'Submitted', 'statusDescription' => 'Proposal has been submitted for review'],
                ['statusName' => 'Under Review', 'statusDescription' => 'Proposal is currently being reviewed by the committee'],
                ['statusName' => 'Revisions Required', 'statusDescription' => 'Proposal needs revisions before approval'],
                ['statusName' => 'Approved', 'statusDescription' => 'Proposal has been approved and can proceed'],
                ['statusName' => 'Rejected', 'statusDescription' => 'Proposal has been rejected'],
                ['statusName' => 'Endorsed', 'statusDescription' => 'Proposal has been endorsed']
            ]);
        }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('status');
    }
};

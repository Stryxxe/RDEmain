<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\Activity;
use App\Models\User;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Skip - no users exist to seed activities for
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Activity::whereIn('action', ['create', 'update', 'delete'])->delete();
    }
};

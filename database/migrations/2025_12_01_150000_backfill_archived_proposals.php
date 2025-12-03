<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Get all RDD user IDs
        $rddUserIds = DB::table('users')
            ->join('user_roles', 'users.userRolesID', '=', 'user_roles.userRoleID')
            ->where('user_roles.userRole', 'RDD')
            ->pluck('users.userID');

        if ($rddUserIds->isEmpty()) {
            return;
        }

        // Get all proposals that have approved endorsements from RDD users
        $rddEndorsements = DB::table('endorsements')
            ->whereIn('endorserID', $rddUserIds)
            ->where('endorsementStatus', 'approved')
            ->get();

        // Update proposals with archivedByRDD timestamp from their RDD endorsement date
        foreach ($rddEndorsements as $endorsement) {
            DB::table('proposals')
                ->where('proposalID', $endorsement->proposalID)
                ->whereNull('archivedByRDD')
                ->update([
                    'archivedByRDD' => $endorsement->endorsedAt ?? $endorsement->created_at ?? now(),
                ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Optionally clear archivedByRDD for backfilled records
        // This is destructive and should be used with caution
        // DB::table('proposals')->update(['archivedByRDD' => null]);
    }
};

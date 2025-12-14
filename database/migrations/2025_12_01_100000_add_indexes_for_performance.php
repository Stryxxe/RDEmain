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
        Schema::table('endorsements', function (Blueprint $table) {
            // Add composite index for faster endorsement queries
            $table->index(['proposalID', 'endorsementStatus'], 'idx_endorsements_proposal_status');
            $table->index(['endorserID', 'endorsementStatus'], 'idx_endorsements_endorser_status');
        });

        Schema::table('reviews', function (Blueprint $table) {
            // Add index for faster review queries
            $table->index(['proposalID', 'reviewerID'], 'idx_reviews_proposal_reviewer');
        });

        Schema::table('proposals', function (Blueprint $table) {
            // Add composite index for status and user queries
            $table->index(['statusID', 'userID'], 'idx_proposals_status_user');
            $table->index('uploadedAt', 'idx_proposals_uploaded_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('endorsements', function (Blueprint $table) {
            $table->dropIndex('idx_endorsements_proposal_status');
            $table->dropIndex('idx_endorsements_endorser_status');
        });

        Schema::table('reviews', function (Blueprint $table) {
            $table->dropIndex('idx_reviews_proposal_reviewer');
        });

        Schema::table('proposals', function (Blueprint $table) {
            $table->dropIndex('idx_proposals_status_user');
            $table->dropIndex('idx_proposals_uploaded_at');
        });
    }
};

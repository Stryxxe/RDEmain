<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Facades\Schema;

class Proposal extends Model
{
    use HasFactory;

    protected $table = 'proposals';
    protected $primaryKey = 'proposalID';
    public $incrementing = true;
    public $timestamps = true;

    protected $fillable = [
        'custom_proposal_id',
        'researchTitle',
        'description',
        'objectives',
        'researchCenter',
        'researchAgenda',
        'dostSPs',
        'sustainableDevelopmentGoals',
        'proposedBudget',
        'budgetBreakdown',
        'revisionFile',
        'matrixOfCompliance',
        'uploadedAt',
        'statusID',
        'userID',
        'archivedByRDD',
        'resubmittedAfterRevision',
        'revisionComments'
    ];

    protected $casts = [
        'researchAgenda' => 'array',
        'dostSPs' => 'array',
        'sustainableDevelopmentGoals' => 'array',
        'matrixOfCompliance' => 'array',
        'budgetBreakdown' => 'array',
        'proposedBudget' => 'decimal:2',
        'uploadedAt' => 'datetime',
        'resubmittedAfterRevision' => 'datetime'
    ];

    /**
     * Get the user that owns the proposal
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'userID', 'userID');
    }

    /**
     * Get the status of the proposal
     */
    public function status(): BelongsTo
    {
        return $this->belongsTo(Status::class, 'statusID', 'statusID');
    }

    /**
     * Get the files associated with the proposal
     */
    public function files(): HasMany
    {
        return $this->hasMany(File::class, 'proposalID', 'proposalID');
    }

    /**
     * Get the reviews for this proposal
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class, 'proposalID', 'proposalID');
    }

    /**
     * Get the decisions for this proposal
     */
    public function decisions(): HasMany
    {
        return $this->hasMany(Decision::class, 'proposalID', 'proposalID');
    }

    /**
     * Get the endorsements for this proposal
     */
    public function endorsements(): HasMany
    {
        return $this->hasMany(Endorsement::class, 'proposalID', 'proposalID');
    }

    /**
     * Get the progress reports for this proposal
     */
    public function progressReports(): HasMany
    {
        return $this->hasMany(ProgressReport::class, 'proposalID', 'proposalID');
    }

    /**
     * Get the proponents for this proposal
     */
    public function proponents()
    {
        return $this->belongsToMany(User::class, 'proposal_proponents', 'proposalID', 'userID')
            ->withPivot('projectRoleID')
            ->withTimestamps();
    }

    /**
     * Scope to filter by status
     */
    public function scopeByStatus($query, $statusId)
    {
        return $query->where('statusID', $statusId);
    }

    /**
     * Scope to filter by user
     */
    public function scopeByUser($query, $userId)
    {
        return $query->where('userID', $userId);
    }

    /**
     * Get formatted budget from matrix of compliance
     */
    public function getFormattedBudgetAttribute()
    {
        $matrix = $this->matrixOfCompliance;
        if (isset($matrix['proposedBudget'])) {
            return number_format($matrix['proposedBudget'], 2);
        }
        return '0.00';
    }

    /**
     * Get research agenda from matrix of compliance
     */
    public function getResearchAgendaAttribute()
    {
        $matrix = $this->matrixOfCompliance;
        return $matrix['researchAgenda'] ?? [];
    }

    /**
     * Get DOST SPs from matrix of compliance
     */
    public function getDostSPsAttribute()
    {
        $matrix = $this->matrixOfCompliance;
        return $matrix['dostSPs'] ?? [];
    }

    /**
     * Get SDGs from matrix of compliance
     */
    public function getSustainableDevelopmentGoalsAttribute()
    {
        $matrix = $this->matrixOfCompliance;
        return $matrix['sustainableDevelopmentGoals'] ?? [];
    }

    /**
     * Generate custom proposal ID
     * Format: YEAR-RDP-INT/EXT-college_idNo-sequence
     */
    public static function generateCustomProposalId($userID, $researchCenter)
    {
        // Get year from settings (fail gracefully if settings table doesn't exist)
        $year = date('Y');
        try {
            if (Schema::hasTable('settings')) {
                $yearSetting = Setting::where('key', 'proposal_id_year')->first();
                $year = $yearSetting ? $yearSetting->value : date('Y');
            }
        } catch (\Exception $e) {
            // If settings table doesn't exist or query fails, use current year
            \Log::warning('Failed to get year from settings, using current year: ' . $e->getMessage());
        }

        // Get user's department college_idNo
        $user = User::with('department')->find($userID);
        $collegeIdNo = $user && $user->department ? ($user->department->college_idNo ?: 'XXX') : 'XXX';

        // Generate base ID with literal "INT/EXT"
        $baseId = "{$year}-RDP-INT/EXT-{$collegeIdNo}";

        // Find the next sequence number for this combination
        $lastProposal = self::where('custom_proposal_id', 'LIKE', "{$baseId}-%")
            ->orderBy('custom_proposal_id', 'desc')
            ->first();

        $sequence = 1;
        if ($lastProposal) {
            // Extract sequence number from last ID (e.g., "2025-RDP-INT/EXT-05-003" -> 003)
            preg_match('/-(\d+)$/', $lastProposal->custom_proposal_id, $matches);
            if (isset($matches[1])) {
                $sequence = intval($matches[1]) + 1;
            }
        }

        // Return formatted ID with 3-digit sequence
        return sprintf("%s-%03d", $baseId, $sequence);
    }
}

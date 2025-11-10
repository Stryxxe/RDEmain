<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Proposal extends Model
{
    use HasFactory;

    protected $table = 'proposals';
    protected $primaryKey = 'proposalID';
    public $incrementing = true;
    public $timestamps = true;

    protected $fillable = [
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
        'userID'
    ];

    protected $casts = [
        'researchAgenda' => 'array',
        'dostSPs' => 'array',
        'sustainableDevelopmentGoals' => 'array',
        'matrixOfCompliance' => 'array',
        'budgetBreakdown' => 'array',
        'proposedBudget' => 'decimal:2',
        'uploadedAt' => 'datetime'
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
}

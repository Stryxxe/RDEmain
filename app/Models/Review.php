<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    use HasFactory;

    protected $table = 'reviews';
    protected $primaryKey = 'reviewID';
    public $incrementing = true;
    public $timestamps = true;

    protected $fillable = [
        'proposalID',
        'reviewerID',
        'remarks',
        'matrixOfCompliance',
        'reviewedAt',
        'decisionID'
    ];

    protected $casts = [
        'reviewedAt' => 'datetime',
        'matrixOfCompliance' => 'array'
    ];

    /**
     * Get the proposal being reviewed
     */
    public function proposal(): BelongsTo
    {
        return $this->belongsTo(Proposal::class, 'proposalID', 'proposalID');
    }

    /**
     * Get the reviewer
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewerID', 'userID');
    }

    /**
     * Get the decision for this review
     */
    public function decision(): BelongsTo
    {
        return $this->belongsTo(ReviewDecision::class, 'decisionID', 'decisionID');
    }
}

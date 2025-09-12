<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Decision extends Model
{
    use HasFactory;

    protected $table = 'decisions';
    protected $primaryKey = 'decisionID';
    public $incrementing = true;
    public $timestamps = true;

    protected $fillable = [
        'proposalID',
        'decisionMakerID',
        'decisionType',
        'decisionComments',
        'decisionDate'
    ];

    protected $casts = [
        'decisionDate' => 'datetime'
    ];

    /**
     * Get the proposal for this decision
     */
    public function proposal(): BelongsTo
    {
        return $this->belongsTo(Proposal::class, 'proposalID', 'proposalID');
    }

    /**
     * Get the decision maker
     */
    public function decisionMaker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'decisionMakerID', 'userID');
    }
}

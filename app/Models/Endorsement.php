<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Endorsement extends Model
{
    use HasFactory;

    protected $table = 'endorsements';
    protected $primaryKey = 'endorsementID';
    public $incrementing = true;
    public $timestamps = true;

    protected $fillable = [
        'proposalID',
        'endorserID',
        'endorsementComments',
        'endorsementDate',
        'endorsementStatus'
    ];

    protected $casts = [
        'endorsementDate' => 'datetime'
    ];

    /**
     * Get the proposal for this endorsement
     */
    public function proposal(): BelongsTo
    {
        return $this->belongsTo(Proposal::class, 'proposalID', 'proposalID');
    }

    /**
     * Get the endorser
     */
    public function endorser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'endorserID', 'userID');
    }
}

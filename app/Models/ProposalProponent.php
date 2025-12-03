<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProposalProponent extends Model
{
    use HasFactory;

    protected $table = 'proposal_proponents';
    protected $primaryKey = 'id';
    public $incrementing = true;
    public $timestamps = true;

    protected $fillable = [
        'proposalID',
        'userID',
    ];

    public function proposal()
    {
        return $this->belongsTo(Proposal::class, 'proposalID', 'proposalID');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'userID', 'userID');
    }
}

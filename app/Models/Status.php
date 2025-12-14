<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Status extends Model
{
    use HasFactory;

    protected $table = 'status';
    protected $primaryKey = 'statusID';
    public $incrementing = true;
    public $timestamps = true;

    protected $fillable = [
        'statusName',
        'statusDescription'
    ];

    /**
     * Get the proposals with this status
     */
    public function proposals(): HasMany
    {
        return $this->hasMany(Proposal::class, 'statusID', 'statusID');
    }
}

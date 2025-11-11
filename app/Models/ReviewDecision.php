<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReviewDecision extends Model
{
    use HasFactory;

    protected $table = 'review_decisions';
    protected $primaryKey = 'decisionID';
    public $incrementing = true;
    public $timestamps = true;

    protected $fillable = [
        'decision'
    ];
}





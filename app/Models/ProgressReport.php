<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProgressReport extends Model
{
    use HasFactory;

    protected $table = 'progress_reports';
    protected $primaryKey = 'reportID';
    public $incrementing = true;
    public $timestamps = true;

    protected $fillable = [
        'proposalID',
        'userID',
        'reportType',
        'reportPeriod',
        'progressPercentage',
        'budgetUtilized',
        'achievements',
        'challenges',
        'nextMilestone',
        'additionalNotes',
        'submittedAt'
    ];

    protected $casts = [
        'budgetUtilized' => 'decimal:2',
        'progressPercentage' => 'integer',
        'submittedAt' => 'datetime'
    ];

    /**
     * Get the proposal this report belongs to
     */
    public function proposal(): BelongsTo
    {
        return $this->belongsTo(Proposal::class, 'proposalID', 'proposalID');
    }

    /**
     * Get the user who submitted this report
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'userID', 'userID');
    }

    /**
     * Get the files associated with this report
     */
    public function files(): HasMany
    {
        return $this->hasMany(File::class, 'reportID', 'reportID');
    }
}






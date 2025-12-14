<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TimelineStage extends Model
{
    use HasFactory;

    protected $table = 'timeline_stages';
    protected $primaryKey = 'stageID';
    public $incrementing = true;
    public $timestamps = true;

    protected $fillable = [
        'stageName',
        'stageDescription',
        'orderIndex',
        'statusID',
        'isActive',
        'icon',
        'color'
    ];

    protected $casts = [
        'isActive' => 'boolean',
        'orderIndex' => 'integer',
    ];

    /**
     * Get the status associated with this timeline stage
     */
    public function status(): BelongsTo
    {
        return $this->belongsTo(Status::class, 'statusID', 'statusID');
    }

    /**
     * Scope to get only active stages
     */
    public function scopeActive($query)
    {
        return $query->where('isActive', true);
    }

    /**
     * Scope to order stages by their order index
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('orderIndex', 'asc');
    }
}

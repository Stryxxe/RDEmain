<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailTemplate extends Model
{
    protected $table = 'email_templates';
    protected $primaryKey = 'templateID';
    
    protected $fillable = [
        'templateType',
        'subject',
        'body',
        'description',
        'isActive',
        'variables',
    ];

    protected $casts = [
        'variables' => 'json',
        'isActive' => 'boolean',
    ];

    /**
     * Get template by type
     */
    public static function getByType(string $type): ?self
    {
        return self::where('templateType', $type)->where('isActive', true)->first();
    }
}


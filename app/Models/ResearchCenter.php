<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ResearchCenter extends Model
{
    use HasFactory;

    protected $primaryKey = 'centerID';

    protected $fillable = [
        'name',
        'departmentID',
    ];

    public function department()
    {
        return $this->belongsTo(Department::class, 'departmentID', 'departmentID');
    }

    public function users()
    {
        return $this->hasMany(User::class, 'researchCenterID', 'centerID');
    }
}

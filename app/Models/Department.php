<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    use HasFactory;

    protected $primaryKey = 'departmentID';
    
    public $timestamps = false;

    protected $fillable = [
        'name',
        'departmentName',
    ];

    public function users()
    {
        return $this->hasMany(User::class, 'departmentID', 'departmentID');
    }
}

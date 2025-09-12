<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    use HasFactory;

    protected $table = 'user_roles';
    protected $primaryKey = 'userRoleID';
    
    protected $fillable = [
        'userRole',
    ];

    public function users()
    {
        return $this->hasMany(User::class, 'userRolesID', 'userRoleID');
    }
}

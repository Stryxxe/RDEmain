<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectRole extends Model
{
    use HasFactory;

    protected $table = 'project_roles';
    protected $primaryKey = 'projectRoleID';

    protected $fillable = [
        'roleName',
        'isActive',
    ];

    protected $casts = [
        'isActive' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the proponents with this role
     */
    public function proponents()
    {
        return $this->belongsToMany(User::class, 'proposal_proponents', 'projectRoleID', 'userID');
    }
}

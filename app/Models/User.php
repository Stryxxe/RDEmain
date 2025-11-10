<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $primaryKey = 'userID';
    
    protected $fillable = [
        'firstName',
        'lastName',
        'email',
        'phone',
        'password',
        'departmentID',
        'userRolesID',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $appends = [
        'fullName'
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }

    public function role()
    {
        return $this->belongsTo(Role::class, 'userRolesID', 'userRoleID');
    }

    public function department()
    {
        return $this->belongsTo(Department::class, 'departmentID', 'departmentID');
    }

    public function proposals()
    {
        return $this->hasMany(Proposal::class, 'userID', 'userID');
    }

    public function reviews()
    {
        return $this->hasMany(Review::class, 'reviewerID', 'userID');
    }

    public function decisions()
    {
        return $this->hasMany(Decision::class, 'decisionMakerID', 'userID');
    }

    public function endorsements()
    {
        return $this->hasMany(Endorsement::class, 'endorserID', 'userID');
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class, 'userID', 'userID');
    }

    public function sentMessages()
    {
        return $this->hasMany(Message::class, 'senderID', 'userID');
    }

    public function receivedMessages()
    {
        return $this->hasMany(Message::class, 'recipientID', 'userID');
    }

    public function getFullNameAttribute()
    {
        return $this->firstName . ' ' . $this->lastName;
    }
}

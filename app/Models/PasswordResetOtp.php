<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class PasswordResetOtp extends Model
{
    use HasFactory;

    protected $fillable = [
        'email',
        'otp',
        'expires_at',
        'used',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'used' => 'boolean',
    ];

    /**
     * Check if OTP is valid (not expired and not used)
     */
    public function isValid(): bool
    {
        return !$this->used && $this->expires_at->isFuture();
    }

    /**
     * Mark OTP as used
     */
    public function markAsUsed(): void
    {
        $this->update(['used' => true]);
    }

    /**
     * Generate a 6-digit OTP
     */
    public static function generateOtp(): string
    {
        return str_pad((string) rand(0, 999999), 6, '0', STR_PAD_LEFT);
    }

    /**
     * Create or update OTP for email
     */
    public static function createOrUpdateOtp(string $email): self
    {
        // Invalidate any existing unused OTPs for this email
        self::where('email', $email)
            ->where('used', false)
            ->where('expires_at', '>', now())
            ->update(['used' => true]);

        // Create new OTP (expires in 15 minutes)
        return self::create([
            'email' => $email,
            'otp' => self::generateOtp(),
            'expires_at' => Carbon::now()->addMinutes(15),
            'used' => false,
        ]);
    }

    /**
     * Find valid OTP for email
     */
    public static function findValidOtp(string $email, string $otp): ?self
    {
        return self::where('email', $email)
            ->where('otp', $otp)
            ->where('used', false)
            ->where('expires_at', '>', now())
            ->first();
    }
}




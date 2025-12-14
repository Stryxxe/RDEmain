<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\PasswordResetOtp;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;

class OtpPasswordResetController extends Controller
{
    /**
     * Display the forgot password form
     */
    public function showForgotPasswordForm(): Response
    {
        return Inertia::render('Auth/ForgotPasswordOtp');
    }

    /**
     * Resend OTP (same as sendOtp but preserves email from session)
     */
    public function resendOtp(Request $request)
    {
        $email = $request->session()->get('otp_email') ?? $request->input('email');
        
        if (!$email) {
            return redirect()->route('password.request-otp')
                ->withErrors(['email' => 'Please enter your email address first.']);
        }

        // Create new OTP
        $otpRecord = PasswordResetOtp::createOrUpdateOtp($email);
        
        // Send OTP email
        try {
            Mail::to($email)->send(new \App\Mail\PasswordResetOtp($otpRecord->otp, $email));
            
            return back()->with([
                'status' => 'A new OTP has been sent to your email address. Please check your inbox.',
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to resend OTP email', [
                'email' => $email,
                'error' => $e->getMessage()
            ]);
            
            return back()->withErrors(['otp' => 'Failed to resend OTP. Please try again later.']);
        }
    }

    /**
     * Send OTP to user's email
     */
    public function sendOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ], [
            'email.exists' => 'We could not find a user with that email address.',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $email = $request->email;
        
        // Check if user exists and is active
        $user = User::where('email', $email)->first();
        if (!$user) {
            return back()->withErrors(['email' => 'We could not find a user with that email address.']);
        }

        // Check if user account is active
        if ($user->status === 'pending') {
            return back()->withErrors(['email' => 'Your account is pending approval. Please contact administrator.']);
        }

        if ($user->status === 'inactive') {
            return back()->withErrors(['email' => 'Your account is inactive. Please contact administrator.']);
        }

        // Create or update OTP
        $otpRecord = PasswordResetOtp::createOrUpdateOtp($email);
        
        // Send OTP email
        try {
            Mail::to($email)->send(new \App\Mail\PasswordResetOtp($otpRecord->otp, $email));
            
            // Store email in session for OTP verification
            $request->session()->put('otp_email', $email);
            
            return redirect()->route('password.verify-otp')->with([
                'status' => 'OTP has been sent to your email address. Please check your inbox.',
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to send OTP email', [
                'email' => $email,
                'error' => $e->getMessage()
            ]);
            
            return back()->withErrors(['email' => 'Failed to send OTP. Please try again later.']);
        }
    }

    /**
     * Display the verify OTP form
     */
    public function showVerifyOtpForm(Request $request): Response
    {
        $email = $request->session()->get('otp_email') ?? $request->input('email');
        
        if (!$email) {
            return redirect()->route('password.request-otp')
                ->withErrors(['email' => 'Please enter your email address first.']);
        }

        return Inertia::render('Auth/VerifyOtp', [
            'email' => $email,
            'status' => session('status'),
        ]);
    }

    /**
     * Verify OTP
     */
    public function verifyOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
            'otp' => 'required|string|size:6',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $email = $request->email;
        $otp = $request->otp;

        // Find valid OTP
        $otpRecord = PasswordResetOtp::findValidOtp($email, $otp);

        if (!$otpRecord) {
            return back()->withErrors(['otp' => 'Invalid or expired OTP. Please request a new one.'])->withInput();
        }

        // Mark OTP as used
        $otpRecord->markAsUsed();

        // Store email in session for password reset
        $request->session()->put('password_reset_email', $email);
        $request->session()->put('otp_verified', true);
        // Keep email in session for display
        $request->session()->put('otp_email', $email);

        return redirect()->route('password.reset-otp')
            ->with('status', 'OTP verified successfully. Please create a new password.');
    }

    /**
     * Display the reset password form
     */
    public function showResetPasswordForm(Request $request): Response
    {
        $email = $request->session()->get('password_reset_email');
        $otpVerified = $request->session()->get('otp_verified');

        if (!$email || !$otpVerified) {
            return redirect()->route('password.request-otp')
                ->withErrors(['email' => 'Please verify your OTP first.']);
        }

        return Inertia::render('Auth/ResetPasswordOtp', [
            'email' => $email,
            'status' => session('status'),
        ]);
    }

    /**
     * Reset password
     */
    public function resetPassword(Request $request)
    {
        $email = $request->session()->get('password_reset_email');
        $otpVerified = $request->session()->get('otp_verified');

        if (!$email || !$otpVerified) {
            return redirect()->route('password.request-otp')
                ->withErrors(['email' => 'Please verify your OTP first.']);
        }

        $validator = Validator::make($request->all(), [
            'password' => 'required|string|min:8|confirmed',
        ], [
            'password.confirmed' => 'The password confirmation does not match.',
            'password.min' => 'The password must be at least 8 characters.',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator);
        }

        // Find user and update password
        $user = User::where('email', $email)->first();
        
        if (!$user) {
            return redirect()->route('password.request-otp')
                ->withErrors(['email' => 'User not found.']);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        // Clear session
        $request->session()->forget(['password_reset_email', 'otp_verified', 'otp_email']);

        // Invalidate any remaining OTPs for this email
        PasswordResetOtp::where('email', $email)
            ->where('used', false)
            ->update(['used' => true]);

        return redirect()->route('login')
            ->with('status', 'Password reset successfully! You can now log in with your new password.');
    }
}


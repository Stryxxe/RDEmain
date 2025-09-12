<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\JsonResponse;

class AuthenticatedSessionController extends Controller
{
    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): JsonResponse|RedirectResponse
    {
        $request->authenticate();

        $user = Auth::user();
        
        // If this is an API request, return JSON with token
        if ($request->expectsJson() || $request->is('api/*')) {
            $token = $user->createToken('auth-token')->plainTextToken;
            
            // Load relationships
            $user->load(['role', 'department']);
            
            return response()->json([
                'user' => $user,
                'token' => $token,
                'message' => 'Login successful'
            ]);
        }

        // For web requests, use session-based auth
        $request->session()->regenerate();
        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): JsonResponse|RedirectResponse
    {
        // If this is an API request, revoke the token
        if ($request->expectsJson() || $request->is('api/*')) {
            $request->user()->currentAccessToken()->delete();
            
            return response()->json([
                'message' => 'Logout successful'
            ]);
        }

        // For web requests, use session-based logout
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/');
    }
}

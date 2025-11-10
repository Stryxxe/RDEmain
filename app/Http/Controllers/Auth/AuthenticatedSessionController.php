<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => true,
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        // Load user relationships for redirect
        $user = Auth::user();
        $user->load(['role', 'department']);

        // Redirect based on user role
        return redirect()->intended($this->getRoleBasedRedirect($user));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }

    /**
     * Get redirect path based on user role
     */
    private function getRoleBasedRedirect($user): string
    {
        $userRole = $user->role->userRole ?? null;
        
        if (!$userRole) {
            return '/';
        }

        // Normalize role name to lowercase for route
        $rolePath = strtolower($userRole);
        
        // Map role names to their route prefixes
        $roleMap = [
            'administrator' => 'admin',
            'rdd' => 'rdd',
            'cm' => 'cm',
            'proponent' => 'proponent',
            'op' => 'op',
            'osuoru' => 'osuur',
            'reviewer' => 'reviewer',
        ];

        $routePrefix = $roleMap[strtolower($userRole)] ?? strtolower($userRole);
        
        return "/{$routePrefix}";
    }
}

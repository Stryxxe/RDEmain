<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the dashboard.
     */
    public function index(): RedirectResponse
    {
        $user = Auth::user();

        if (!$user) {
            return redirect()->route('login');
        }

        // Load user relationships for redirect
        $user->load(['role', 'department']);

        // Get role-based redirect path
        $redirectPath = $this->getRoleBasedRedirect($user);

        // Redirect to role-based dashboard
        return redirect($redirectPath);
    }

    /**
     * Get redirect path based on user role
     */
    private function getRoleBasedRedirect($user): string
    {
        $userRole = $user->role->userRole ?? null;

        if (!$userRole) {
            \Log::warning('DashboardController: User has no role', ['userID' => $user->userID]);
            return '/';
        }

        // Normalize role name to handle case variations
        $normalizedRole = trim($userRole);
        
        // Map role names to their route prefixes (case-insensitive)
        $roleMap = [
            'administrator' => 'admin',
            'admin' => 'admin',
            'rdd' => 'rdd',
            'cm' => 'cm',
            'proponent' => 'proponent',
            'op' => 'op',
            'osuoru' => 'osuur',
            'reviewer' => 'reviewer',
        ];

        $roleKey = strtolower($normalizedRole);
        $routePrefix = $roleMap[$roleKey] ?? strtolower($normalizedRole);

        \Log::info('DashboardController: Redirecting user', [
            'userID' => $user->userID,
            'userRole' => $userRole,
            'normalizedRole' => $normalizedRole,
            'routePrefix' => $routePrefix,
            'redirectPath' => "/{$routePrefix}"
        ]);

        return "/{$routePrefix}";
    }
}

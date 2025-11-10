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
            return '/';
        }

        // Map role names to their route prefixes
        $roleMap = [
            'Administrator' => 'admin',
            'Admin' => 'admin',
            'RDD' => 'rdd',
            'CM' => 'cm',
            'Proponent' => 'proponent',
            'OP' => 'op',
            'OSUORU' => 'osuur',
            'Reviewer' => 'reviewer',
        ];

        $routePrefix = $roleMap[$userRole] ?? strtolower($userRole);
        
        return "/{$routePrefix}";
    }
}


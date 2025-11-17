<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        if ($user) {
            // Load relationships
            $user->load(['role', 'department']);

            // Ensure department name is accessible (handle both 'name' and 'departmentName')
            if ($user->department) {
                // This ensures the department name is available in the frontend
                $user->department->makeVisible(['name', 'departmentName']);
            }
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
            ],
            'flash' => [
                'message' => $request->session()->get('message'),
                'userRole' => $request->session()->get('userRole'),
                'roleName' => $request->session()->get('roleName'),
            ],
            // Share CSRF token so it can be updated on navigation
            'csrf_token' => csrf_token(),
        ];
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    public function index(Request $request)
    {
        $users = User::with(['role', 'department'])->get();

        $mapped = $users->map(function (User $user) {
            $roleName = $user->role?->userRole ?? '';
            $roleSlug = match (strtolower($roleName)) {
                'administrator', 'admin' => 'admin',
                'proponent' => 'proponent',
                'center manager', 'cm', 'central manager' => 'central_manager',
                'rdd' => 'rdd',
                'rde' => 'rde',
                'op', 'office of the president' => 'op',
                'osuoru', 'office of student affairs and university relations unit' => 'osuoro',
                default => 'proponent',
            };

            return [
                'id' => $user->userID,
                'firstName' => $user->firstName,
                'lastName' => $user->lastName,
                'email' => $user->email,
                'role' => $roleSlug,
                'status' => 'active',
                'department' => $user->department?->departmentName ?? '—',
                'lastLogin' => null,
                'avatar' => 'https://ui-avatars.com/api/?name=' . urlencode($user->firstName . ' ' . $user->lastName) . '&background=3b82f6&color=fff',
            ];
        });

        return response()->json([
            'users' => $mapped,
            'total' => $mapped->count(),
        ]);
    }
}



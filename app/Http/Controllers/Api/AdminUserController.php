<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminUserController extends Controller
{
    public function index(Request $request)
    {
        $users = User::with(['role', 'department'])->get();

        $mapped = $users->map(fn (User $user) => $this->formatUserResponse($user));

        return response()->json([
            'users' => $mapped,
            'total' => $mapped->count(),
        ]);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'firstName' => ['required', 'string', 'max:50'],
            'lastName' => ['required', 'string', 'max:50'],
            'email' => [
                'required',
                'email',
                'max:50',
                Rule::unique('users', 'email')->ignore($user->userID, 'userID'),
            ],
            'role' => ['required', 'string'],
            'department' => ['required', 'string', 'max:255'],
            'status' => ['sometimes', 'string'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:50'],
        ]);

        $roleSlug = $validated['role'];
        $roleName = $this->getRoleNameFromSlug($roleSlug);
        $role = Role::firstOrCreate(
            ['userRole' => $roleName],
            ['userRole' => $roleName]
        );

        $departmentName = $validated['department'];
        $department = Department::where('departmentName', $departmentName)
            ->orWhere('name', $departmentName)
            ->first();

        if (!$department) {
            $department = Department::create([
                'name' => $departmentName,
                'departmentName' => $departmentName,
            ]);
        }

        $user->firstName = $validated['firstName'];
        $user->lastName = $validated['lastName'];
        $user->email = $validated['email'];
        $user->phone = $validated['phone'] ?? null;
        $user->departmentID = $department->departmentID;
        $user->userRolesID = $role->userRoleID;
        $user->save();

        $user->load(['role', 'department']);

        $responseUser = $this->formatUserResponse($user, [
            'role' => $roleSlug,
            'status' => $validated['status'] ?? 'active',
            'phone' => $validated['phone'] ?? '',
        ]);

        return response()->json([
            'message' => 'User updated successfully.',
            'user' => $responseUser,
        ]);
    }

    protected function formatUserResponse(User $user, array $overrides = []): array
    {
        return [
            'id' => $user->userID,
            'firstName' => $user->firstName,
            'lastName' => $user->lastName,
            'email' => $user->email,
            'role' => $overrides['role'] ?? $this->getRoleSlugFromName($user->role?->userRole ?? ''),
            'status' => $overrides['status'] ?? 'active',
            'department' => $user->department?->departmentName
                ?? $user->department?->name
                ?? '—',
            'lastLogin' => null,
            'avatar' => 'https://ui-avatars.com/api/?name=' . urlencode($user->firstName . ' ' . $user->lastName) . '&background=3b82f6&color=fff',
            'phone' => $overrides['phone'] ?? ($user->phone ?? ''),
        ];
    }

    protected function getRoleNameFromSlug(string $slug): string
    {
        return match (strtolower($slug)) {
            'admin' => 'Administrator',
            'central_manager' => 'Central Manager',
            'rdd' => 'RDD',
            'rde' => 'RDE',
            'op' => 'OP',
            'osuoro' => 'OSUORO',
            default => 'Proponent',
        };
    }

    protected function getRoleSlugFromName(string $name): string
    {
        return match (strtolower($name)) {
            'administrator', 'admin' => 'admin',
            'proponent' => 'proponent',
            'center manager', 'cm', 'central manager' => 'central_manager',
            'rdd' => 'rdd',
            'rde' => 'rde',
            'op', 'office of the president' => 'op',
            'osuoru', 'osuoro', 'office of student affairs and university relations unit' => 'osuoro',
            default => 'proponent',
        };
    }
}



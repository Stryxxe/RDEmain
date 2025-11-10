<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminUserController extends Controller
{
    public function index(Request $request)
    {
        // Debug: Check if user is authenticated
        if (!$request->user()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated',
                'debug' => [
                    'session_id' => $request->session()->getId(),
                    'has_session' => $request->hasSession(),
                    'auth_check' => auth()->check(),
                    'auth_user' => auth()->user() ? 'exists' : 'null',
                    'cookies' => $request->cookies->all(),
                ]
            ], 401);
        }

        $users = User::with(['role', 'department'])->get();

        $mapped = $users->map(fn (User $user) => $this->formatUserResponse($user));

        return response()->json([
            'users' => $mapped,
            'total' => $mapped->count(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'firstName' => ['required', 'string', 'max:50'],
            'lastName' => ['required', 'string', 'max:50'],
            'email' => ['required', 'email', 'max:50', 'unique:users,email'],
            'role' => ['required', 'string'],
            'department' => ['required', 'string', 'max:255'],
            'status' => ['sometimes', 'string'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:50'],
            'password' => ['sometimes', 'nullable', 'string', 'min:8'],
        ]);

        $roleSlug = $validated['role'];
        $roleName = $this->getRoleNameFromSlug($roleSlug);
        $role = Role::firstOrCreate(
            ['userRole' => $roleName],
            ['userRole' => $roleName]
        );

        $departmentName = $validated['department'];
        $department = $this->resolveDepartment($departmentName);

        $generatedPassword = null;
        $password = $validated['password'] ?? null;

        if (empty($password)) {
            $generatedPassword = Str::random(12);
            $password = $generatedPassword;
        }

        $createData = [
            'firstName' => $validated['firstName'],
            'lastName' => $validated['lastName'],
            'email' => $validated['email'],
            'password' => $password,
            'departmentID' => $department->departmentID,
            'userRolesID' => $role->userRoleID,
        ];
        if (Schema::hasColumn((new User())->getTable(), 'phone')) {
            $createData['phone'] = $validated['phone'] ?? null;
        }
        $user = User::create($createData);

        $user->load(['role', 'department']);

        $responseUser = $this->formatUserResponse($user, [
            'role' => $roleSlug,
            'status' => $validated['status'] ?? 'active',
            'phone' => $validated['phone'] ?? '',
        ]);

        $responseData = [
            'message' => 'User created successfully.',
            'user' => $responseUser,
        ];

        if ($generatedPassword) {
            $responseData['temporaryPassword'] = $generatedPassword;
        }

        return response()->json($responseData, 201);
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
            'password' => ['sometimes', 'nullable', 'string', 'min:8'],
        ]);

        $roleSlug = $validated['role'];
        $roleName = $this->getRoleNameFromSlug($roleSlug);
        $role = Role::firstOrCreate(
            ['userRole' => $roleName],
            ['userRole' => $roleName]
        );

        $departmentName = $validated['department'];
        $department = $this->resolveDepartment($departmentName);

        $user->firstName = $validated['firstName'];
        $user->lastName = $validated['lastName'];
        $user->email = $validated['email'];
        if (Schema::hasColumn((new User())->getTable(), 'phone')) {
            $user->phone = $validated['phone'] ?? null;
        }
        if (!empty($validated['password'])) {
            $user->password = $validated['password'];
        }
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
            'admin' => 'Admin',
            'central_manager' => 'CM',
            'rdd' => 'RDD',
            'rde' => 'RDE',
            'op' => 'OP',
            'osuoro' => 'OSUORU',
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

    protected function resolveDepartment(string $departmentName): Department
    {
        $table = (new Department())->getTable();

        $query = Department::query()->where('name', $departmentName);

        if (Schema::hasColumn($table, 'departmentName')) {
            $query->orWhere('departmentName', $departmentName);
        }

        $department = $query->first();

        if ($department) {
            return $department;
        }

        $data = ['name' => $departmentName];

        if (Schema::hasColumn($table, 'departmentName')) {
            $data['departmentName'] = $departmentName;
        }

        return Department::create($data);
    }
}



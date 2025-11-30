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

        $users = User::with(['role', 'department', 'researchCenter'])
            ->whereHas('role', function($query) {
                $query->where('userRole', '!=', 'Admin');
            })
            ->get();

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
            'researchCenter' => ['sometimes', 'nullable', 'string', 'max:255'],
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

        // Resolve research center if provided
        $researchCenterID = null;
        if (!empty($validated['researchCenter'])) {
            $researchCenter = \App\Models\ResearchCenter::where('name', $validated['researchCenter'])
                ->orWhere(function($q) use ($validated) {
                    $q->whereRaw('LOWER(name) = ?', [strtolower($validated['researchCenter'])]);
                })
                ->first();
            
            if ($researchCenter) {
                $researchCenterID = $researchCenter->centerID;
            }
        }

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
            'researchCenterID' => $researchCenterID,
            'userRolesID' => $role->userRoleID,
        ];
        // Persist status if column exists
        if (Schema::hasColumn((new User())->getTable(), 'status')) {
            $createData['status'] = $validated['status'] ?? 'inactive';
        }
        if (Schema::hasColumn((new User())->getTable(), 'phone')) {
            $createData['phone'] = $validated['phone'] ?? null;
        }
        $user = User::create($createData);

        $user->load(['role', 'department', 'researchCenter']);

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
            'researchCenter' => ['sometimes', 'nullable', 'string', 'max:255'],
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

        // Resolve research center if provided
        $researchCenterID = null;
        if (!empty($validated['researchCenter'])) {
            $researchCenter = \App\Models\ResearchCenter::where('name', $validated['researchCenter'])
                ->orWhere(function($q) use ($validated) {
                    $q->whereRaw('LOWER(name) = ?', [strtolower($validated['researchCenter'])]);
                })
                ->first();
            
            if ($researchCenter) {
                $researchCenterID = $researchCenter->centerID;
            }
        }

        $user->firstName = $validated['firstName'];
        $user->lastName = $validated['lastName'];
        $user->email = $validated['email'];
        // Persist status if column exists
        if (Schema::hasColumn((new User())->getTable(), 'status')) {
            $user->status = $validated['status'] ?? $user->status ?? 'inactive';
        }
        if (Schema::hasColumn((new User())->getTable(), 'phone')) {
            $user->phone = $validated['phone'] ?? null;
        }
        if (!empty($validated['password'])) {
            $user->password = $validated['password'];
        }
        $user->departmentID = $department->departmentID;
        $user->researchCenterID = $researchCenterID;
        $user->userRolesID = $role->userRoleID;
        $user->save();

        $user->load(['role', 'department', 'researchCenter']);

        $responseUser = $this->formatUserResponse($user, [
            'role' => $roleSlug,
            'status' => Schema::hasColumn((new User())->getTable(), 'status') ? ($validated['status'] ?? ($user->status ?? 'inactive')) : ($validated['status'] ?? 'active'),
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
            'status' => $overrides['status'] ?? (Schema::hasColumn((new User())->getTable(), 'status') ? ($user->status ?? 'inactive') : 'active'),
            'department' => $user->department?->departmentName
                ?? $user->department?->name
                ?? '—',
            'lastLogin' => null,
            'avatar' => 'https://ui-avatars.com/api/?name=' . urlencode($user->firstName . ' ' . $user->lastName) . '&background=3b82f6&color=fff',
            'phone' => $overrides['phone'] ?? ($user->phone ?? ''),
            // Include research center data so frontend can display and edit it
            'researchCenter' => $user->researchCenter?->name ?? $user->researchCenter?->centerName ?? null,
            'researchCenterID' => $user->researchCenter?->centerID ?? null,
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

    public function getDepartments(Request $request)
    {
        if (!$request->user()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated'
            ], 401);
        }

        try {
            $table = (new Department())->getTable();
            $hasDepartmentName = Schema::hasColumn($table, 'departmentName');
            
            // Order by departmentName if column exists, otherwise by name
            $orderColumn = $hasDepartmentName ? 'departmentName' : 'name';
            $departments = Department::orderBy($orderColumn, 'asc')->get();

            // Format departments to return both name and departmentName if available
            $formattedDepartments = $departments->map(function($dept) {
                return [
                    'departmentID' => $dept->departmentID,
                    'name' => $dept->departmentName ?? $dept->name ?? 'Unknown',
                    'departmentName' => $dept->departmentName ?? $dept->name ?? 'Unknown'
                ];
            })->unique('name')->values();

            return response()->json([
                'success' => true,
                'data' => $formattedDepartments
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch departments',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function storeDepartment(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:departments,name'],
        ]);

        try {
            $department = Department::create([
                'name' => $validated['name'],
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'departmentID' => $department->departmentID,
                    'name' => $department->name,
                    'departmentName' => $department->name,
                ]
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create department',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function updateDepartment(Request $request, $id)
    {
        $department = Department::findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:departments,name,' . $id . ',departmentID'],
        ]);

        try {
            $department->update([
                'name' => $validated['name'],
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'departmentID' => $department->departmentID,
                    'name' => $department->name,
                    'departmentName' => $department->name,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update department',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroyDepartment($id)
    {
        try {
            $department = Department::findOrFail($id);
            
            // Check if department has users or research centers
            if ($department->users()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete department with assigned users'
                ], 422);
            }

            if ($department->researchCenters()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete department with assigned research centers'
                ], 422);
            }

            $department->delete();

            return response()->json([
                'success' => true,
                'message' => 'Department deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete department',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($userId)
    {
        try {
            $user = User::findOrFail($userId);
            
            // Prevent deletion of admin users
            if ($user->role && $user->role->userRole === 'Admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete admin users'
                ], 422);
            }

            // Check if user has related records that prevent deletion
            try {
                $hasProposals = \DB::table('proposals')->where('userID', $userId)->count() > 0;
                $hasReviews = \DB::table('reviews')->where('reviewerID', $userId)->count() > 0;
                $hasDecisions = \DB::table('decisions')->where('decisionMakerID', $userId)->count() > 0;
                
                if ($hasProposals || $hasReviews || $hasDecisions) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Cannot delete user with existing proposals, reviews, or decisions. Please reassign or remove them first.'
                    ], 422);
                }

                // Delete related records that can be safely removed
                \DB::table('endorsements')->where('endorserID', $userId)->delete();
                \DB::table('notifications')->where('userID', $userId)->delete();
                \DB::table('messages')->where('senderID', $userId)->orWhere('receiverID', $userId)->delete();
            } catch (\Exception $relException) {
                // If checking relationships fails, try to delete anyway
                \Log::warning('Could not check user relationships: ' . $relException->getMessage());
            }
            
            // Now delete the user
            $user->delete();

            return response()->json([
                'success' => true,
                'message' => 'User deleted successfully'
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to delete user ' . $userId . ': ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete user. This user may have related data that prevents deletion.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }
}



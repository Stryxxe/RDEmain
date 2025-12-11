<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Role;
use App\Models\User;
use App\Services\ActivityService;
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
            'department' => ['nullable', 'string', 'max:255'],
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

        // Resolve department if provided
        $departmentID = null;
        if (!empty($validated['department'])) {
            $department = $this->resolveDepartment($validated['department']);
            $departmentID = $department->departmentID;
        }

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
            'userRolesID' => $role->userRoleID,
        ];
        
        // Only include departmentID if it's not null
        if ($departmentID !== null) {
            $createData['departmentID'] = $departmentID;
        }
        
        // Only include researchCenterID if it's not null
        if ($researchCenterID !== null) {
            $createData['researchCenterID'] = $researchCenterID;
        }
        // Persist status if column exists
        if (Schema::hasColumn((new User())->getTable(), 'status')) {
            $createData['status'] = $validated['status'] ?? 'pending';
        }
        if (Schema::hasColumn((new User())->getTable(), 'phone')) {
            $createData['phone'] = $validated['phone'] ?? null;
        }
        $user = User::create($createData);

        $user->load(['role', 'department', 'researchCenter']);

        // Log activity (fail gracefully if activities table doesn't exist)
        try {
            ActivityService::logUserCreate(
                $validated,
                $user->userID
            );
        } catch (\Exception $e) {
            // Log error but don't fail user creation
            \Log::warning('Failed to log user creation activity: ' . $e->getMessage());
        }

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
            'department' => ['nullable', 'string', 'max:255'],
            'researchCenter' => ['sometimes', 'nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'in:pending,active,inactive'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:50'],
            'password' => ['sometimes', 'nullable', 'string', 'min:8'],
        ]);

        $roleSlug = $validated['role'];
        $roleName = $this->getRoleNameFromSlug($roleSlug);
        $role = Role::firstOrCreate(
            ['userRole' => $roleName],
            ['userRole' => $roleName]
        );

        // Resolve department if provided
        $departmentID = null;
        if (!empty($validated['department'])) {
            $department = $this->resolveDepartment($validated['department']);
            $departmentID = $department->departmentID;
        } else {
            // Keep existing department if not provided
            $departmentID = $user->departmentID;
        }

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
        // Persist status if column exists - always update status if provided in request
        if (Schema::hasColumn((new User())->getTable(), 'status')) {
            // Check request input first (before validation), then validated array
            // This ensures we get the status even if validation didn't include it
            $statusValue = $request->input('status');
            
            // If not in request, check validated array
            if ($statusValue === null) {
                $statusValue = $validated['status'] ?? null;
            }
            
            // Only update if status is explicitly provided and is valid
            if ($statusValue !== null && $statusValue !== '' && in_array($statusValue, ['pending', 'active', 'inactive'])) {
                $oldStatus = $user->status;
                $user->status = $statusValue;
                \Log::info('User status updated', [
                    'userID' => $user->userID,
                    'oldStatus' => $oldStatus,
                    'newStatus' => $statusValue,
                    'requestStatus' => $request->input('status'),
                    'validatedStatus' => $validated['status'] ?? 'not in validated'
                ]);
            } else {
                \Log::warning('User status not updated', [
                    'userID' => $user->userID,
                    'statusValue' => $statusValue,
                    'requestStatus' => $request->input('status'),
                    'validatedStatus' => $validated['status'] ?? 'not in validated',
                    'currentStatus' => $user->status
                ]);
            }
        }
        if (Schema::hasColumn((new User())->getTable(), 'phone')) {
            $user->phone = $validated['phone'] ?? null;
        }
        if (!empty($validated['password'])) {
            $user->password = $validated['password'];
        }
        $user->departmentID = $departmentID;
        $user->researchCenterID = $researchCenterID;
        $user->userRolesID = $role->userRoleID;
        $user->save();

        $user->load(['role', 'department', 'researchCenter']);

        // Log activity
        ActivityService::logUserUpdate(
            $user->userID,
            $user->getOriginal(),
            $user->toArray()
        );

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

    public function resetPassword(Request $request, User $user)
    {
        // Generate or use configured default password
        $defaultPassword = config('auth.default_reset_password')
            ?? env('DEFAULT_RESET_PASSWORD', 'ChangeMe123!');

        $user->password = $defaultPassword;
        $user->save();

        ActivityService::logUserUpdate(
            $user->userID,
            ['password' => 'reset'],
            ['password' => 'reset']
        );

        return response()->json([
            'message' => 'Password reset successfully.',
            'temporaryPassword' => $defaultPassword,
        ]);
    }

    public function activate(Request $request, User $user)
    {
        // Prevent activating admin users (they should always be active)
        if ($user->role && $user->role->userRole === 'Admin') {
            return response()->json([
                'success' => false,
                'message' => 'Admin users are always active'
            ], 422);
        }

        $oldStatus = $user->status ?? 'pending';
        
        if (Schema::hasColumn((new User())->getTable(), 'status')) {
            $user->status = 'active';
            $user->save();
        }

        // Log activity
        ActivityService::logUserUpdate(
            $user->userID,
            ['status' => $oldStatus],
            ['status' => 'active']
        );

        $user->load(['role', 'department', 'researchCenter']);
        $responseUser = $this->formatUserResponse($user, [
            'status' => 'active',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'User activated successfully.',
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
            'center manager', 'cm', 'central manager' => 'central_manager', // Note: accepts both 'center manager' and 'central manager' but maps to 'central_manager'
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
                    'departmentName' => $dept->departmentName ?? $dept->name ?? 'Unknown',
                    'college_idNo' => $dept->college_idNo
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
            'college_idNo' => ['nullable', 'string', 'max:50'],
        ]);

        try {
            $department = Department::create([
                'name' => $validated['name'],
                'college_idNo' => $validated['college_idNo'] ?? null,
            ]);

            // Log activity (fail gracefully if activities table doesn't exist)
            try {
                ActivityService::logDepartmentCreate($department->departmentID, $department->name);
            } catch (\Exception $e) {
                \Log::warning('Failed to log department creation activity: ' . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'departmentID' => $department->departmentID,
                    'name' => $department->name,
                    'departmentName' => $department->name,
                    'college_idNo' => $department->college_idNo,
                ]
            ], 201);
        } catch (\Exception $e) {
            \Log::error('Failed to create department: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create department',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred while creating the department'
            ], 500);
        }
    }

    public function updateDepartment(Request $request, $id)
    {
        $department = Department::findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:departments,name,' . $id . ',departmentID'],
            'college_idNo' => ['nullable', 'string', 'max:50'],
        ]);

        try {
            $oldName = $department->name;
            $department->update([
                'name' => $validated['name'],
                'college_idNo' => $validated['college_idNo'] ?? null,
            ]);

            // Log activity (fail gracefully if activities table doesn't exist)
            try {
                ActivityService::logDepartmentUpdate($department->departmentID, $oldName, $department->name);
            } catch (\Exception $e) {
                \Log::warning('Failed to log department update activity: ' . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'departmentID' => $department->departmentID,
                    'name' => $department->name,
                    'departmentName' => $department->name,
                    'college_idNo' => $department->college_idNo,
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

            $departmentName = $department->name;
            $department->delete();

            // Log activity (fail gracefully if activities table doesn't exist)
            try {
                ActivityService::logDepartmentDelete($id, $departmentName);
            } catch (\Exception $e) {
                \Log::warning('Failed to log department deletion activity: ' . $e->getMessage());
            }

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

    public function forceDeleteDepartment($id)
    {
        try {
            $department = Department::findOrFail($id);
            $departmentName = $department->name;
            
            // Get counts before deletion for reporting
            $usersCount = $department->users()->count();
            $researchCentersCount = $department->researchCenters()->count();
            
            // Remove department assignments from users (set to null)
            $department->users()->update(['departmentID' => null]);
            
            // Remove department assignments from research centers (set to null)
            $department->researchCenters()->update(['departmentID' => null]);
            
            // Now delete the department
            $department->delete();

            // Log activity (fail gracefully if activities table doesn't exist)
            try {
                ActivityService::logDepartmentDelete($id, $departmentName);
            } catch (\Exception $e) {
                \Log::warning('Failed to log department deletion activity: ' . $e->getMessage());
            }

            $message = "Department '{$departmentName}' force deleted successfully.";
            if ($usersCount > 0 || $researchCentersCount > 0) {
                $message .= " Removed department assignments from {$usersCount} user(s) and {$researchCentersCount} research center(s).";
            }

            return response()->json([
                'success' => true,
                'message' => $message,
                'usersAffected' => $usersCount,
                'researchCentersAffected' => $researchCentersCount
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to force delete department: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to force delete department',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function bulkDeleteDepartments(Request $request)
    {
        try {
            $validated = $request->validate([
                'ids' => 'required|array',
                'ids.*' => 'integer|exists:departments,departmentID'
            ]);

            $ids = $validated['ids'];
            $deletedCount = 0;
            $errors = [];

            foreach ($ids as $id) {
                try {
                    $department = Department::findOrFail($id);
                    
                    // Check if department has users or research centers
                    if ($department->users()->count() > 0) {
                        $errors[] = "Cannot delete department '{$department->name}' - it has assigned users";
                        continue;
                    }

                    if ($department->researchCenters()->count() > 0) {
                        $errors[] = "Cannot delete department '{$department->name}' - it has assigned research centers";
                        continue;
                    }

                    $departmentName = $department->name;
                    $department->delete();
                    $deletedCount++;

                    // Log activity (fail gracefully if activities table doesn't exist)
                    try {
                        ActivityService::logDepartmentDelete($id, $departmentName);
                    } catch (\Exception $e) {
                        \Log::warning('Failed to log department deletion activity: ' . $e->getMessage());
                    }
                } catch (\Exception $e) {
                    $errors[] = "Failed to delete department ID {$id}: " . $e->getMessage();
                }
            }

            if ($deletedCount > 0) {
                return response()->json([
                    'success' => true,
                    'message' => "Successfully deleted {$deletedCount} department(s)",
                    'deletedCount' => $deletedCount,
                    'errors' => $errors
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'No departments were deleted',
                    'errors' => $errors
                ], 422);
            }
        } catch (\Exception $e) {
            \Log::error('Failed to bulk delete departments: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete departments: ' . $e->getMessage()
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

            // Store user data for activity log
            $userData = $user->toArray();

            // Check if user has related records that prevent deletion
            try {
                $hasProposals = \DB::table('proposals')->where('userID', $userId)->count() > 0;
                $hasReviews = \DB::table('reviews')->where('reviewerID', $userId)->count() > 0;
                $hasDecisions = \DB::table('decisions')->where('decisionMakerID', $userId)->count() > 0;
                
                if ($hasProposals) {
                    // Delete proposals and all related data
                    $proposalIds = \DB::table('proposals')->where('userID', $userId)->pluck('proposalID');
                    
                    foreach ($proposalIds as $proposalId) {
                        // Delete files associated with proposals
                        \DB::table('files')->where('proposalID', $proposalId)->delete();
                        // Delete proposal_proponents
                        \DB::table('proposal_proponents')->where('proposalID', $proposalId)->delete();
                        // Delete reviews
                        \DB::table('reviews')->where('proposalID', $proposalId)->delete();
                        // Delete decisions
                        \DB::table('decisions')->where('proposalID', $proposalId)->delete();
                        // Delete endorsements
                        \DB::table('endorsements')->where('proposalID', $proposalId)->delete();
                        // Delete progress reports
                        \DB::table('progress_reports')->where('proposalID', $proposalId)->delete();
                    }
                    
                    // Delete the proposals
                    \DB::table('proposals')->where('userID', $userId)->delete();
                }
                
                if ($hasReviews || $hasDecisions) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Cannot delete user with existing reviews or decisions. Please reassign or remove them first.'
                    ], 422);
                }

                // Delete related records that can be safely removed
                \DB::table('proposal_proponents')->where('userID', $userId)->delete();
                \DB::table('endorsements')->where('endorserID', $userId)->delete();
                \DB::table('notifications')->where('userID', $userId)->delete();
                \DB::table('messages')->where('senderID', $userId)->orWhere('receiverID', $userId)->delete();
                \DB::table('reviews')->where('reviewerID', $userId)->delete();
                \DB::table('decisions')->where('decisionMakerID', $userId)->delete();
                \DB::table('progress_reports')->where('userID', $userId)->delete();
            } catch (\Exception $relException) {
                // If checking relationships fails, try to delete anyway
                \Log::warning('Could not check user relationships: ' . $relException->getMessage());
            }
            
            // Now delete the user
            $user->delete();

            // Log activity
            ActivityService::logUserDelete($userData);

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



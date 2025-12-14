<?php

namespace App\Http\Controllers;

use App\Models\ProjectRole;
use App\Services\ActivityService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class ProjectRoleController extends Controller
{
    /**
     * Get all project roles
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $user->loadMissing('role');

            // Only Admin can manage project roles
            if ($user->role?->userRole !== 'Admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Only Admin users can access project roles.'
                ], 403);
            }

            $roles = ProjectRole::orderBy('roleName', 'asc')->get();

            return response()->json([
                'success' => true,
                'data' => $roles
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch project roles',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all active project roles (for use in forms)
     */
    public function getActive(Request $request): JsonResponse
    {
        try {
            $roles = ProjectRole::where('isActive', true)
                ->orderBy('roleName', 'asc')
                ->get(['projectRoleID', 'roleName']);

            return response()->json([
                'success' => true,
                'data' => $roles
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch active project roles',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a new project role
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $user->loadMissing('role');

            if ($user->role?->userRole !== 'Admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Only Admin users can create project roles.'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'roleName' => 'required|string|max:100|unique:project_roles,roleName',
                'isActive' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $role = ProjectRole::create([
                'roleName' => $request->roleName,
                'isActive' => $request->isActive ?? true,
            ]);

            // Log activity
            ActivityService::logRoleCreate($role->projectRoleID, $role->roleName);

            return response()->json([
                'success' => true,
                'message' => 'Project role created successfully',
                'data' => $role
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create project role',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a project role
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $user = Auth::user();
            $user->loadMissing('role');

            if ($user->role?->userRole !== 'Admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Only Admin users can update project roles.'
                ], 403);
            }

            $role = ProjectRole::find($id);

            if (!$role) {
                return response()->json([
                    'success' => false,
                    'message' => 'Project role not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'roleName' => 'required|string|max:100|unique:project_roles,roleName,' . $id . ',projectRoleID',
                'isActive' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $role->update([
                'roleName' => $request->roleName,
                'isActive' => $request->isActive ?? $role->isActive,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Project role updated successfully',
                'data' => $role
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update project role',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a project role
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        try {
            $user = Auth::user();
            $user->loadMissing('role');

            if ($user->role?->userRole !== 'Admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Only Admin users can delete project roles.'
                ], 403);
            }

            $role = ProjectRole::find($id);

            if (!$role) {
                return response()->json([
                    'success' => false,
                    'message' => 'Project role not found'
                ], 404);
            }

            $roleName = $role->roleName;
            $role->delete();

            // Log activity
            ActivityService::logRoleDelete($id, $roleName);

            return response()->json([
                'success' => true,
                'message' => 'Project role deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete project role',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

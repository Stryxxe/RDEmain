<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Services\ActivityService;
use App\Http\Controllers\ProposalController;
use App\Http\Controllers\EndorsementController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\ProjectRoleController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\OptimizedNotificationController;
use App\Http\Controllers\Api\OptimizedMessageController;
use App\Http\Controllers\Api\SimpleOptimizedMessageController;
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\SettingController;
use App\Http\Middleware\RequestDeduplication;

Route::post('/login', [AuthenticatedSessionController::class, 'store']);
Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->middleware('auth:web');

use App\Models\Department;
use App\Models\ResearchCenter;
use App\Models\Setting;
use App\Models\Status;

// Get all statuses
Route::get('/statuses', function () {
    return response()->json([
        'success' => true,
        'data' => Status::all()
    ]);
})->middleware('auth:web');

// Get upload settings (max file size) - public endpoint for all authenticated users
Route::get('/upload-settings', function () {
    $allowedTypes = Setting::get('allowed_file_types', '.pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg');
    $maxFileSize = Setting::get('max_file_size', 20);
    
    // Convert comma-separated string to array for frontend
    $typesArray = array_map('trim', explode(',', $allowedTypes));
    $typesArray = array_map(function($type) {
        return str_replace('.', '', $type);
    }, $typesArray);
    
    return response()->json([
        'maxFileSizeMB' => (int) $maxFileSize,
        'maxFileSizeKB' => (int) $maxFileSize * 1024,
        'allowedFileTypes' => $typesArray,
    ]);
})->middleware('auth:web');

// Get authenticated user
Route::get('/user', function (Request $request) {
    $user = $request->user();
    // Eager load researchCenter so frontend can display correct center instead of defaulting to department
    $user->load(['role', 'department', 'researchCenter']);
    return $user;
})->middleware('auth:web');

// Live user search for adding proposal proponents
Route::get('/users/search', function (Request $request) {
    $validated = $request->validate([
        'q' => 'nullable|string|max:100',
        'limit' => 'nullable|integer|min:1|max:20',
    ]);

    $q = trim($validated['q'] ?? '');
    $limit = (int)($validated['limit'] ?? 10);
    $currentUser = $request->user();

    $users = \App\Models\User::query()
        ->with('role')
        ->select(['userID', 'firstName', 'lastName', 'email', 'userRolesID', 'researchCenterID'])
        // Restrict to same research center as current user
        ->when(!is_null($currentUser->researchCenterID), function ($query) use ($currentUser) {
            $query->where('researchCenterID', $currentUser->researchCenterID);
        }, function ($query) {
            // If current user has no research center, return no results
            $query->whereRaw('1 = 0');
        })
        // Only allow searching other Proponents
        ->whereHas('role', function ($q) {
            $q->where('userRole', 'Proponent');
        })
        // Exclude current user
        ->where('userID', '!=', $currentUser->userID)
        // Text search
        ->when($q !== '', function ($query) use ($q) {
            $like = "%{$q}%";
            $query->where(function ($sub) use ($like) {
                $sub->where('firstName', 'like', $like)
                    ->orWhere('lastName', 'like', $like)
                    ->orWhereRaw("CONCAT(firstName,' ',lastName) like ?", [$like])
                    ->orWhere('email', 'like', $like);
            });
        })
        ->orderBy('lastName')
        ->orderBy('firstName')
        ->limit($limit)
        ->get()
        ->map(function ($u) {
            return [
                'userID' => $u->userID,
                'firstName' => $u->firstName,
                'lastName' => $u->lastName,
                'email' => $u->email,
                'role' => $u->role?->userRole,
            ];
        });

    return response()->json(['success' => true, 'data' => $users]);
})->middleware('auth:web');

// Search all users (for RDD and Admin roles to message anyone)
Route::get('/users/search-all', function (Request $request) {
    $validated = $request->validate([
        'q' => 'nullable|string|max:100',
        'limit' => 'nullable|integer|min:1|max:50',
    ]);

    $q = trim($validated['q'] ?? '');
    $limit = (int)($validated['limit'] ?? 20);
    $currentUser = $request->user();

    // Only allow RDD and Admin to search all users
    $userRole = $currentUser->role?->userRole;
    if (!in_array($userRole, ['RDD', 'Admin'])) {
        return response()->json([
            'success' => false,
            'message' => 'Unauthorized'
        ], 403);
    }

    $users = \App\Models\User::query()
        ->with('role')
        ->select(['userID', 'firstName', 'lastName', 'email', 'userRolesID'])
        // Exclude current user
        ->where('userID', '!=', $currentUser->userID)
        // Text search
        ->when($q !== '', function ($query) use ($q) {
            $like = "%{$q}%";
            $query->where(function ($sub) use ($like) {
                $sub->where('firstName', 'like', $like)
                    ->orWhere('lastName', 'like', $like)
                    ->orWhereRaw("CONCAT(firstName,' ',lastName) like ?", [$like])
                    ->orWhere('email', 'like', $like);
            });
        })
        ->orderBy('lastName')
        ->orderBy('firstName')
        ->limit($limit)
        ->get()
        ->map(function ($u) {
            return [
                'userID' => $u->userID,
                'firstName' => $u->firstName,
                'lastName' => $u->lastName,
                'email' => $u->email,
                'role' => $u->role?->userRole,
            ];
        });

    return response()->json(['success' => true, 'data' => $users]);
})->middleware('auth:web');

// Admin: Research Centers list for user creation form
Route::get('/admin/research-centers', function (Request $request) {
    try {
        $query = ResearchCenter::query()->with('department');
        if ($request->has('departmentID')) {
            $query->where('departmentID', $request->integer('departmentID'));
        }
        $centers = $query->orderBy('name')->get()->map(function ($center) {
            return [
                'centerID' => $center->centerID,
                'centerName' => $center->name,
                'departmentID' => $center->departmentID,
                'departmentName' => $center->department->name ?? $center->department->departmentName ?? null,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $centers,
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'success' => false,
            'message' => 'Failed to load research centers',
        ], 500);
    }
})->middleware('auth:web');

// Admin: Create research center
Route::post('/admin/research-centers', function (Request $request) {
    $request->validate([
        'name' => 'required|string|max:255',
        'departmentID' => 'nullable|exists:departments,departmentID'
    ]);
    
    $center = ResearchCenter::create([
        'name' => $request->name,
        'departmentID' => $request->departmentID
    ]);
    
    // Log activity
    ActivityService::logResearchCenterCreate($center->researchCenterID, $center->name);
    
    return response()->json(['success' => true, 'data' => $center]);
})->middleware('auth:web');

// Admin: Update research center
Route::put('/admin/research-centers/{id}', function (Request $request, $id) {
    $request->validate([
        'name' => 'required|string|max:255',
        'departmentID' => 'nullable|exists:departments,departmentID'
    ]);
    
    $center = ResearchCenter::findOrFail($id);
    $center->update([
        'name' => $request->name,
        'departmentID' => $request->departmentID
    ]);
    
    return response()->json(['success' => true, 'data' => $center]);
})->middleware('auth:web');

// Admin: Delete research center
Route::delete('/admin/research-centers/{id}', function ($id) {
    $center = ResearchCenter::findOrFail($id);
    $centerName = $center->name;
    $center->delete();
    
    // Log activity
    ActivityService::logResearchCenterDelete($id, $centerName);
    
    return response()->json(['success' => true]);
})->middleware('auth:web');

// Update user profile
Route::put('/user', function (Request $request) {
    $request->validate([
        'firstName' => 'required|string|max:255',
        'lastName' => 'required|string|max:255',
        'email' => 'required|string|email|max:255|unique:users,email,' . $request->user()->userID . ',userID',
    ]);

    $user = $request->user();
    $user->update([
        'firstName' => $request->firstName,
        'lastName' => $request->lastName,
        'email' => $request->email,
    ]);

    // Reload with researchCenter relation after update
    $user->load(['role', 'department', 'researchCenter']);
    return $user;
})->middleware('auth:web');

// Change password
Route::post('/user/change-password', function (Request $request) {
    $request->validate([
        'current_password' => 'required|string',
        'new_password' => 'required|string|min:8|confirmed',
    ]);

    $user = $request->user();

    // Verify current password
    if (!Hash::check($request->current_password, $user->password)) {
        return response()->json([
            'success' => false,
            'message' => 'Current password is incorrect'
        ], 400);
    }

    // Update password
    $user->update([
        'password' => Hash::make($request->new_password)
    ]);

    return response()->json([
        'success' => true,
        'message' => 'Password changed successfully'
    ]);
})->middleware('auth:web');

// Upload avatar
Route::post('/user/avatar', function (Request $request) {
    $request->validate([
        'avatar' => 'required|image|mimes:jpeg,png,jpg,gif|max:3072',
    ]);

    $user = $request->user();

    // Delete old avatar if exists
    if ($user->avatar && \Storage::disk('public')->exists($user->avatar)) {
        \Storage::disk('public')->delete($user->avatar);
    }

    // Store new avatar
    $path = $request->file('avatar')->store('avatars', 'public');

    // Update user avatar
    $user->update(['avatar' => $path]);

    return response()->json([
        'success' => true,
        'message' => 'Avatar updated successfully',
        'avatar' => asset('storage/' . $path)
    ]);
})->middleware('auth:web');

// Proposal routes - Use session-based auth for Inertia
// Explicitly use 'web' guard to ensure session authentication works
Route::middleware(['auth:web', \App\Http\Middleware\EnsureUserIsActive::class])->group(function () {
    // System Settings - simple JSON-backed storage
    Route::get('/admin/settings', function (Request $request) {
        $path = storage_path('app/settings.json');
        if (!\File::exists($path)) {
            $default = [
                'systemName' => 'Research Management System',
                'systemVersion' => '1.0.0',
                'sessionTimeout' => 30,
                'logRetention' => 90,
                'backupFrequency' => 'daily',
                'allowDepartmentCreation' => true,
                'requireDepartmentAssignment' => true,
                'fileStorage' => [
                    'maxFileSize' => 20,
                    'allowedTypes' => ['pdf','docx','xlsx','csv','png','jpg'],
                ],
            ];
            \File::put($path, json_encode($default, JSON_PRETTY_PRINT));
        }
        $json = json_decode(\File::get($path), true);
        
        // Flatten maxFileSize for easier frontend access
        if (isset($json['fileStorage']['maxFileSize'])) {
            $json['maxFileSize'] = $json['fileStorage']['maxFileSize'];
        } else {
            $json['maxFileSize'] = 20;
        }
        
        return response()->json($json);
    });

    Route::put('/admin/settings', function (Request $request) {
        try {
            $validated = $request->validate([
                'systemName' => 'required|string|max:255',
                'systemVersion' => 'required|string|max:50',
                'sessionTimeout' => 'required|integer|min:5|max:480',
                'logRetention' => 'required|integer|min:7|max:365',
                'backupFrequency' => 'required|in:hourly,daily,weekly,monthly',
                'allowDepartmentCreation' => 'required',
                'requireDepartmentAssignment' => 'required',
                'maxFileSize' => 'required|integer|min:1|max:20',
            ]);
            
            // Ensure boolean conversion
            $validated['allowDepartmentCreation'] = (bool) $validated['allowDepartmentCreation'];
            $validated['requireDepartmentAssignment'] = (bool) $validated['requireDepartmentAssignment'];
            
            // Extract maxFileSize and store in fileStorage structure
            $maxFileSize = (int) $validated['maxFileSize'];
            unset($validated['maxFileSize']);

            $path = storage_path('app/settings.json');
            
            // Read existing settings to preserve fileStorage.allowedTypes
            $existingData = [];
            if (\File::exists($path)) {
                $existingData = json_decode(\File::get($path), true) ?: [];
            }
            
            // Merge with validated data
            $validated['fileStorage'] = [
                'maxFileSize' => $maxFileSize,
                'allowedTypes' => $existingData['fileStorage']['allowedTypes'] ?? ['pdf','docx','xlsx','csv','png','jpg'],
            ];
            
            \File::put($path, json_encode($validated, JSON_PRETTY_PRINT));
            
            // Return with flattened maxFileSize for frontend
            $response = $validated;
            $response['maxFileSize'] = $maxFileSize;
            
            return response()->json(['success' => true, 'settings' => $response]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Settings validation failed', ['errors' => $e->errors(), 'input' => $request->all()]);
            throw $e;
        }
    });

    // Session Settings (backend for "Security" container)
    Route::get('/admin/session-settings', function (Request $request) {
        $path = storage_path('app/settings.json');
        $data = [];
        if (\File::exists($path)) {
            $data = json_decode(\File::get($path), true) ?: [];
        }
        return response()->json([
            'sessionTimeout' => $data['sessionTimeout'] ?? 30,
            'logRetention' => $data['logRetention'] ?? 90,
        ]);
    });

    Route::put('/admin/session-settings', function (Request $request) {
        $validated = $request->validate([
            'sessionTimeout' => 'required|integer|min:5|max:480',
            'logRetention' => 'required|integer|min:7|max:365',
        ]);

        $path = storage_path('app/settings.json');
        $data = [];
        if (\File::exists($path)) {
            $data = json_decode(\File::get($path), true) ?: [];
        }
        $data['sessionTimeout'] = $validated['sessionTimeout'];
        $data['logRetention'] = $validated['logRetention'];
        \File::put($path, json_encode($data, JSON_PRETTY_PRINT));

        return response()->json(['success' => true, 'session' => $validated]);
    });

    // File Storage Settings (backend for "File Storage" container)
    Route::get('/admin/storage-settings', function (Request $request) {
        $path = storage_path('app/settings.json');
        $data = [];
        if (\File::exists($path)) {
            $data = json_decode(\File::get($path), true) ?: [];
        }
        $storage = $data['fileStorage'] ?? [
            'maxFileSize' => 20,
            'allowedTypes' => ['pdf','docx','xlsx','csv','png','jpg'],
        ];
        return response()->json($storage);
    });

    Route::put('/admin/storage-settings', function (Request $request) {
        $validated = $request->validate([
            'maxFileSize' => 'required|integer|min:1|max:20',
            'allowedTypes' => 'nullable|array',
            'allowedTypes.*' => 'string|in:pdf,doc,docx,xls,xlsx,csv,png,jpg,jpeg,gif',
        ]);

        $path = storage_path('app/settings.json');
        $data = [];
        if (\File::exists($path)) {
            $data = json_decode(\File::get($path), true) ?: [];
        }
        $data['fileStorage'] = [
            'maxFileSize' => (int)$validated['maxFileSize'],
            'allowedTypes' => $validated['allowedTypes'] ?? ['pdf','docx','xlsx','csv','png','jpg'],
        ];
        \File::put($path, json_encode($data, JSON_PRETTY_PRINT));

        return response()->json(['success' => true, 'storage' => $data['fileStorage']]);
    });
    Route::get('/proposals/statistics', [ProposalController::class, 'statistics']);
    Route::get('/proposals/rdd-analytics', [ProposalController::class, 'getRddAnalytics']);
    Route::get('/proposals/cm-endorsed', [ProposalController::class, 'getCmEndorsedProposals']);
    Route::get('/proposals/rdd-endorsed', [ProposalController::class, 'getRddEndorsedProposals']);
    Route::apiResource('proposals', ProposalController::class);
    
    // Endorsement routes
    Route::post('/endorsements', [EndorsementController::class, 'store']);
    Route::get('/endorsements', [EndorsementController::class, 'index']);
    Route::get('/endorsements/proposal/{proposalId}', [EndorsementController::class, 'getByProposal']);
    
    // Progress Report routes
    Route::apiResource('progress-reports', \App\Http\Controllers\ProgressReportController::class);
    
    // File view route by filepath with authentication
    Route::get('/files/view', function (Request $request) {
        $user = Auth::user();
        
        if (!$user) {
            return response('Unauthorized', 401);
        }
        
        $filePath = $request->query('path');
        
        if (!$filePath) {
            return response('File path is required', 400);
        }
        
        // Find file by path
        $file = \App\Models\File::where('filePath', $filePath)->first();
        
        if (!$file) {
            \Log::warning("File not found by path: filePath={$filePath}, userID={$user->userID}");
            return response('File not found', 404);
        }
        
        // Check permissions based on file type
        if ($file->fileType === 'progress_report') {
            // Load user role
            if (!$user->relationLoaded('role')) {
                $user->load('role');
            }
            
            // RDD users can access all progress report files
            if ($user->role && $user->role->userRole === 'RDD') {
                // Allow access
            } 
            // CM users can access files from their department
            else if ($user->role && $user->role->userRole === 'CM') {
                if (!$file->relationLoaded('progressReport.proposal.user.department')) {
                    $file->load('progressReport.proposal.user.department');
                }
                if (!$user->relationLoaded('department')) {
                    $user->load('department');
                }
                
                if ($file->progressReport && 
                    $file->progressReport->proposal && 
                    $file->progressReport->proposal->user &&
                    $file->progressReport->proposal->user->departmentID !== $user->departmentID) {
                    return response('Forbidden: You can only access files from your department', 403);
                }
            }
            // Other users can only access their own files
            else {
                if (!$file->relationLoaded('progressReport')) {
                    $file->load('progressReport');
                }
                if ($file->progressReport && $file->progressReport->userID !== $user->userID) {
                    return response('Forbidden: You can only access your own files', 403);
                }
            }
        } else if ($file->fileType === 'proposal') {
            // Similar permission checks for proposal files
            if (!$user->relationLoaded('role')) {
                $user->load('role');
            }
            
            // RDD and CM users can access all proposal files
            if ($user->role && in_array($user->role->userRole, ['RDD', 'CM'])) {
                // Allow access
            } 
            // Other users can only access their own proposal files
            else {
                if (!$file->relationLoaded('proposal')) {
                    $file->load('proposal');
                }
                if ($file->proposal && $file->proposal->userID !== $user->userID) {
                    return response('Forbidden: You can only access your own files', 403);
                }
            }
        }
        
        // Check if file exists in storage
        if (!Storage::disk('public')->exists($file->filePath)) {
            \Log::error("File path not found in storage: fileID={$file->fileID}, filePath={$file->filePath}, userID={$user->userID}");
            return response('File not found in storage: ' . $file->filePath, 404);
        }
        
        // Return file with appropriate headers for viewing
        $path = Storage::disk('public')->path($file->filePath);
        $mimeType = Storage::disk('public')->mimeType($file->filePath);
        
        \Log::info("Serving file: fileID={$file->fileID}, filePath={$file->filePath}, mimeType={$mimeType}");
        
        return response()->file($path, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'inline; filename="' . $file->fileName . '"',
        ]);
    })->name('files.view.path');
    
    // File view route by file ID with authentication
    Route::get('/files/{fileId}/view', function (Request $request, $fileId) {
        $user = Auth::user();
        
        if (!$user) {
            return response('Unauthorized', 401);
        }
        
        // Use where clause with fileID since that's the primary key
        // Convert to integer if it's a string
        $fileIdInt = (int) $fileId;
        $file = \App\Models\File::where('fileID', $fileIdInt)->first();
        
        if (!$file) {
            \Log::warning("File not found: fileID={$fileId} (as int: {$fileIdInt}), userID={$user->userID}");
            // Try as string as well
            $file = \App\Models\File::where('fileID', $fileId)->first();
        }
        
        if (!$file) {
            return response('File not found', 404);
        }
        
        // Check permissions based on file type
        if ($file->fileType === 'progress_report') {
            // Load user role
            if (!$user->relationLoaded('role')) {
                $user->load('role');
            }
            
            // RDD users can access all progress report files
            if ($user->role && $user->role->userRole === 'RDD') {
                // Allow access
            } 
            // CM users can access files from their department
            else if ($user->role && $user->role->userRole === 'CM') {
                if (!$file->relationLoaded('progressReport.proposal.user.department')) {
                    $file->load('progressReport.proposal.user.department');
                }
                if (!$user->relationLoaded('department')) {
                    $user->load('department');
                }
                
                if ($file->progressReport && 
                    $file->progressReport->proposal && 
                    $file->progressReport->proposal->user &&
                    $file->progressReport->proposal->user->departmentID !== $user->departmentID) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Forbidden: You can only access files from your department'
                    ], 403);
                }
            }
            // Other users can only access their own files
            else {
                if (!$file->relationLoaded('progressReport')) {
                    $file->load('progressReport');
                }
                if ($file->progressReport && $file->progressReport->userID !== $user->userID) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Forbidden: You can only access your own files'
                    ], 403);
                }
            }
        } else if ($file->fileType === 'proposal') {
            // Similar permission checks for proposal files
            if (!$user->relationLoaded('role')) {
                $user->load('role');
            }
            
            // RDD and CM users can access all proposal files
            if ($user->role && in_array($user->role->userRole, ['RDD', 'CM'])) {
                // Allow access
            } 
            // Other users can only access their own proposal files
            else {
                if (!$file->relationLoaded('proposal')) {
                    $file->load('proposal');
                }
                if ($file->proposal && $file->proposal->userID !== $user->userID) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Forbidden: You can only access your own files'
                    ], 403);
                }
            }
        }
        
        // Check if file exists in storage
        if (!Storage::disk('public')->exists($file->filePath)) {
            \Log::error("File path not found in storage: fileID={$file->fileID}, filePath={$file->filePath}, userID={$user->userID}");
            return response('File not found in storage: ' . $file->filePath, 404);
        }
        
        // Return file with appropriate headers for viewing
        $path = Storage::disk('public')->path($file->filePath);
        $mimeType = Storage::disk('public')->mimeType($file->filePath);
        
        \Log::info("Serving file: fileID={$file->fileID}, filePath={$file->filePath}, mimeType={$mimeType}");
        
        return response()->file($path, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'inline; filename="' . $file->fileName . '"',
        ]);
    })->name('files.view');
    
    Route::get('/files/{fileId}/download', function (Request $request, $fileId) {
        $user = Auth::user();
        
        if (!$user) {
            return response('Unauthorized', 401);
        }
        
        // Use where clause with fileID since that's the primary key
        $file = \App\Models\File::where('fileID', $fileId)->first();
        
        if (!$file) {
            \Log::warning("File not found for download: fileID={$fileId}, userID={$user->userID}");
            return response('File not found', 404);
        }
        
        // Check permissions based on file type
        if ($file->fileType === 'progress_report') {
            // Load user role
            if (!$user->relationLoaded('role')) {
                $user->load('role');
            }
            
            // RDD users can access all progress report files
            if ($user->role && $user->role->userRole === 'RDD') {
                // Allow access
            } 
            // CM users can access files from their department
            else if ($user->role && $user->role->userRole === 'CM') {
                if (!$file->relationLoaded('progressReport.proposal.user.department')) {
                    $file->load('progressReport.proposal.user.department');
                }
                if (!$user->relationLoaded('department')) {
                    $user->load('department');
                }
                
                if ($file->progressReport && 
                    $file->progressReport->proposal && 
                    $file->progressReport->proposal->user &&
                    $file->progressReport->proposal->user->departmentID !== $user->departmentID) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Forbidden: You can only access files from your department'
                    ], 403);
                }
            }
            // Other users can only access their own files
            else {
                if (!$file->relationLoaded('progressReport')) {
                    $file->load('progressReport');
                }
                if ($file->progressReport && $file->progressReport->userID !== $user->userID) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Forbidden: You can only access your own files'
                    ], 403);
                }
            }
        } else if ($file->fileType === 'proposal') {
            // Similar permission checks for proposal files
            if (!$user->relationLoaded('role')) {
                $user->load('role');
            }
            
            // RDD and CM users can access all proposal files
            if ($user->role && in_array($user->role->userRole, ['RDD', 'CM'])) {
                // Allow access
            } 
            // Other users can only access their own proposal files
            else {
                if (!$file->relationLoaded('proposal')) {
                    $file->load('proposal');
                }
                if ($file->proposal && $file->proposal->userID !== $user->userID) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Forbidden: You can only access your own files'
                    ], 403);
                }
            }
        }
        
        // Check if file exists in storage
        if (!Storage::disk('public')->exists($file->filePath)) {
            return response()->json([
                'success' => false,
                'message' => 'File not found in storage'
            ], 404);
        }
        
        // Return file download response
        return Storage::disk('public')->download($file->filePath, $file->fileName);
    })->name('files.download');
    
    // Review routes
    Route::post('/reviews', [ReviewController::class, 'store']);
    
    // Optimized Notification routes with caching and deduplication
    Route::middleware([RequestDeduplication::class])->group(function () {
        Route::get('/notifications', [OptimizedNotificationController::class, 'index']);
        Route::get('/notifications/unread-count', [OptimizedNotificationController::class, 'unreadCount']);
    });
    Route::put('/notifications/{id}/read', [OptimizedNotificationController::class, 'markAsRead']);
    Route::put('/notifications/mark-all-read', [OptimizedNotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{id}', [OptimizedNotificationController::class, 'destroy']);
    
    // Simple Optimized Message routes (compatible with all cache drivers)
    Route::get('/messages', [SimpleOptimizedMessageController::class, 'index']);
    Route::get('/messages/sent', [SimpleOptimizedMessageController::class, 'sent']);
    Route::get('/messages/unread-count', [SimpleOptimizedMessageController::class, 'unreadCount']);
    Route::get('/messages/conversations', [SimpleOptimizedMessageController::class, 'conversations']);
    Route::get('/messages/conversation/{otherUserId}', [SimpleOptimizedMessageController::class, 'conversation']);
    Route::get('/messages/available-cm', [SimpleOptimizedMessageController::class, 'getAvailableCM']);
    Route::get('/messages/available-proponents', [SimpleOptimizedMessageController::class, 'getAvailableProponents']);
    Route::post('/messages', [SimpleOptimizedMessageController::class, 'store']);
    Route::get('/messages/{id}', [MessageController::class, 'show']); // Keep original for show method
    Route::put('/messages/{id}/read', [SimpleOptimizedMessageController::class, 'markAsRead']);
    Route::put('/messages/mark-all-read', [SimpleOptimizedMessageController::class, 'markAllAsRead']);
    Route::delete('/messages/{id}', [SimpleOptimizedMessageController::class, 'destroy']);
    Route::delete('/messages/clear-all', [SimpleOptimizedMessageController::class, 'clearAll']);
    Route::delete('/messages/conversation/{otherUserId}', [SimpleOptimizedMessageController::class, 'deleteConversation']);

});

// Admin - Users management
// Explicitly use 'web' guard to ensure session authentication works
Route::middleware(['auth:web'])->group(function () {
    // Settings management
    Route::get('/settings', [SettingController::class, 'index']);
    Route::get('/settings/{key}', [SettingController::class, 'show']);
    Route::put('/settings', [SettingController::class, 'update']);

    // Backup management
    Route::post('/backup/trigger', [SettingController::class, 'triggerBackup']);
    Route::post('/backup/scan', [SettingController::class, 'scanBackupFolder']);
    Route::get('/backup/status', [SettingController::class, 'getBackupStatus']);
    
    Route::get('/admin/users', [AdminUserController::class, 'index']);
    Route::post('/admin/users', [AdminUserController::class, 'store']);
    Route::put('/admin/users/{user:userID}', [AdminUserController::class, 'update']);
    Route::post('/admin/users/{user:userID}/reset-password', [AdminUserController::class, 'resetPassword']);
    Route::delete('/admin/users/{userId}', [AdminUserController::class, 'destroy']);
    
    // Department management
    Route::get('/admin/departments', [AdminUserController::class, 'getDepartments']);
    Route::post('/admin/departments', [AdminUserController::class, 'storeDepartment']);
    Route::put('/admin/departments/{id}', [AdminUserController::class, 'updateDepartment']);
    Route::delete('/admin/departments/{id}', [AdminUserController::class, 'destroyDepartment']);
    
    // Template management - Proponent templates
    Route::get('/admin/templates/proponent', function (Request $request) {
        $templates = [];
        $path = storage_path('app/public/templates/proponent');
        
        if (file_exists($path)) {
            // Load metadata
            $metadataPath = storage_path('app/public/templates/proponent/.metadata.json');
            $metadata = [];
            if (file_exists($metadataPath)) {
                $metadata = json_decode(file_get_contents($metadataPath), true) ?: [];
            }
            
            $files = \File::files($path);
            foreach ($files as $file) {
                $filename = $file->getFilename();
                // Skip metadata file
                if ($filename === '.metadata.json') continue;
                
                // Use custom name from metadata if available, otherwise use filename
                $customName = $metadata[$filename]['customName'] ?? pathinfo($filename, PATHINFO_FILENAME);
                
                $templates[] = [
                    'id' => md5($filename),
                    'name' => $customName,
                    'fileName' => $filename,
                    'filePath' => '/storage/templates/proponent/' . $filename,
                    'url' => asset('storage/templates/proponent/' . $filename),
                    'type' => $file->getExtension(),
                    'size' => round($file->getSize() / 1024, 2) . ' KB',
                    'created_at' => date('Y-m-d H:i:s', $file->getMTime()),
                ];
            }
        }
        
        return response()->json($templates);
    });
    
    Route::post('/admin/templates/proponent', function (Request $request) {
        // Debug: Log what we received
        \Log::info('Proponent template upload attempt', [
            'has_file' => $request->hasFile('file'),
            'all_files' => $request->allFiles(),
            'all_input' => $request->all(),
        ]);
        
        try {
            $validated = $request->validate([
                'file' => 'required|file|max:20480', // 20MB
                'name' => 'nullable|string|max:255',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Proponent template validation failed', ['errors' => $e->errors()]);
            $errorMessage = 'Validation failed';
            if (isset($e->errors()['file']) && str_contains(json_encode($e->errors()['file']), 'failed to upload')) {
                $errorMessage = 'File upload failed. Please ensure your file is under 20MB. Current PHP upload_max_filesize: ' . ini_get('upload_max_filesize');
            }
            return response()->json([
                'success' => false,
                'message' => $errorMessage,
                'errors' => $e->errors()
            ], 422);
        }
        
        try {
            $file = $request->file('file');
            if (!$file || !$file->isValid()) {
                throw new \Exception('Invalid file upload');
            }
            
            $templateName = $request->name ?: pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
            $fileName = time() . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('templates/proponent', $fileName, 'public');
            
            // Store metadata (custom name) in a JSON file
            $metadataPath = storage_path('app/public/templates/proponent/.metadata.json');
            $metadata = [];
            if (file_exists($metadataPath)) {
                $metadata = json_decode(file_get_contents($metadataPath), true) ?: [];
            }
            $metadata[$fileName] = [
                'customName' => $templateName,
                'originalName' => $file->getClientOriginalName(),
                'uploadedAt' => now()->toDateTimeString(),
            ];
            file_put_contents($metadataPath, json_encode($metadata, JSON_PRETTY_PRINT));
            
            // Log activity
            ActivityService::log('create', 'Uploaded proponent template: ' . $templateName, 'Template', null);
            
            // For now, return success - will be saved to database later
            return response()->json([
                'success' => true,
                'message' => 'Proponent template uploaded successfully',
                'data' => [
                    'id' => md5($fileName),
                    'name' => $templateName,
                    'fileName' => $fileName,
                    'filePath' => '/storage/' . $filePath,
                    'url' => asset('storage/' . $filePath),
                    'type' => $file->getClientOriginalExtension(),
                    'size' => round($file->getSize() / 1024, 2) . ' KB',
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload template: ' . $e->getMessage()
            ], 500);
        }
    });
    
    Route::delete('/admin/templates/proponent/{id}', function (Request $request, $id) {
        try {
            $path = storage_path('app/public/templates/proponent');
            if (file_exists($path)) {
                $files = \File::files($path);
                foreach ($files as $file) {
                    $filename = $file->getFilename();
                    if ($filename === '.metadata.json') continue;
                    
                    if (md5($filename) === $id) {
                        \Storage::disk('public')->delete('templates/proponent/' . $filename);
                        
                        // Get template name before removing metadata
                        $metadataPath = storage_path('app/public/templates/proponent/.metadata.json');
                        $templateName = $filename;
                        if (file_exists($metadataPath)) {
                            $metadata = json_decode(file_get_contents($metadataPath), true) ?: [];
                            $templateName = $metadata[$filename]['customName'] ?? $filename;
                            unset($metadata[$filename]);
                            file_put_contents($metadataPath, json_encode($metadata, JSON_PRETTY_PRINT));
                        }
                        
                        // Log activity
                        ActivityService::log('delete', 'Deleted proponent template: ' . $templateName, 'Template', null);
                        
                        return response()->json([
                            'success' => true,
                            'message' => 'Proponent template deleted successfully'
                        ]);
                    }
                }
            }
            return response()->json([
                'success' => false,
                'message' => 'Template not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete template: ' . $e->getMessage()
            ], 500);
        }
    });
    
    // Template management - General templates
    Route::get('/admin/templates/general', function (Request $request) {
        $templates = [];
        $path = storage_path('app/public/templates/general');
        
        if (file_exists($path)) {
            // Load metadata
            $metadataPath = storage_path('app/public/templates/general/.metadata.json');
            $metadata = [];
            if (file_exists($metadataPath)) {
                $metadata = json_decode(file_get_contents($metadataPath), true) ?: [];
            }
            
            $files = \File::files($path);
            foreach ($files as $file) {
                $filename = $file->getFilename();
                // Skip metadata file
                if ($filename === '.metadata.json') continue;
                
                // Use custom name from metadata if available, otherwise use filename
                $customName = $metadata[$filename]['customName'] ?? pathinfo($filename, PATHINFO_FILENAME);
                
                $templates[] = [
                    'id' => md5($filename),
                    'name' => $customName,
                    'fileName' => $filename,
                    'filePath' => '/storage/templates/general/' . $filename,
                    'url' => asset('storage/templates/general/' . $filename),
                    'type' => $file->getExtension(),
                    'size' => round($file->getSize() / 1024, 2) . ' KB',
                    'created_at' => date('Y-m-d H:i:s', $file->getMTime()),
                ];
            }
        }
        
        return response()->json($templates);
    });
    
    Route::post('/admin/templates/general', function (Request $request) {
        // Debug: Log what we received
        \Log::info('General template upload attempt', [
            'has_file' => $request->hasFile('file'),
            'all_files' => $request->allFiles(),
            'all_input' => $request->all(),
        ]);
        
        try {
            $validated = $request->validate([
                'file' => 'required|file|max:20480', // 20MB
                'name' => 'nullable|string|max:255',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('General template validation failed', ['errors' => $e->errors()]);
            $errorMessage = 'Validation failed';
            if (isset($e->errors()['file']) && str_contains(json_encode($e->errors()['file']), 'failed to upload')) {
                $errorMessage = 'File upload failed. Please ensure your file is under 20MB. Current PHP upload_max_filesize: ' . ini_get('upload_max_filesize');
            }
            return response()->json([
                'success' => false,
                'message' => $errorMessage,
                'errors' => $e->errors()
            ], 422);
        }
        
        try {
            $file = $request->file('file');
            if (!$file || !$file->isValid()) {
                throw new \Exception('Invalid file upload');
            }
            
            $templateName = $request->name ?: pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
            $fileName = time() . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('templates/general', $fileName, 'public');
            
            // Store metadata (custom name) in a JSON file
            $metadataPath = storage_path('app/public/templates/general/.metadata.json');
            $metadata = [];
            if (file_exists($metadataPath)) {
                $metadata = json_decode(file_get_contents($metadataPath), true) ?: [];
            }
            $metadata[$fileName] = [
                'customName' => $templateName,
                'originalName' => $file->getClientOriginalName(),
                'uploadedAt' => now()->toDateTimeString(),
            ];
            file_put_contents($metadataPath, json_encode($metadata, JSON_PRETTY_PRINT));
            
            // Log activity
            ActivityService::log('create', 'Uploaded general template: ' . $templateName, 'Template', null);
            
            // For now, return success - will be saved to database later
            return response()->json([
                'success' => true,
                'message' => 'General template uploaded successfully',
                'data' => [
                    'id' => md5($fileName),
                    'name' => $templateName,
                    'fileName' => $fileName,
                    'filePath' => '/storage/' . $filePath,
                    'url' => asset('storage/' . $filePath),
                    'type' => $file->getClientOriginalExtension(),
                    'size' => round($file->getSize() / 1024, 2) . ' KB',
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload template: ' . $e->getMessage()
            ], 500);
        }
    });
    
    Route::delete('/admin/templates/general/{id}', function (Request $request, $id) {
        try {
            $path = storage_path('app/public/templates/general');
            if (file_exists($path)) {
                $files = \File::files($path);
                foreach ($files as $file) {
                    $filename = $file->getFilename();
                    if ($filename === '.metadata.json') continue;
                    
                    if (md5($filename) === $id) {
                        \Storage::disk('public')->delete('templates/general/' . $filename);
                        
                        // Get template name before removing metadata
                        $metadataPath = storage_path('app/public/templates/general/.metadata.json');
                        $templateName = $filename;
                        if (file_exists($metadataPath)) {
                            $metadata = json_decode(file_get_contents($metadataPath), true) ?: [];
                            $templateName = $metadata[$filename]['customName'] ?? $filename;
                            unset($metadata[$filename]);
                            file_put_contents($metadataPath, json_encode($metadata, JSON_PRETTY_PRINT));
                        }
                        
                        // Log activity
                        ActivityService::log('delete', 'Deleted general template: ' . $templateName, 'Template', null);
                        
                        return response()->json([
                            'success' => true,
                            'message' => 'General template deleted successfully'
                        ]);
                    }
                }
            }
            return response()->json([
                'success' => false,
                'message' => 'Template not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete template: ' . $e->getMessage()
            ], 500);
        }
    });
});

// Project Roles Management (Admin only)
Route::middleware('auth:web')->group(function () {
    Route::get('/project-roles', [ProjectRoleController::class, 'index']);
    Route::get('/project-roles/active', [ProjectRoleController::class, 'getActive']);
    Route::post('/project-roles', [ProjectRoleController::class, 'store']);
    Route::put('/project-roles/{id}', [ProjectRoleController::class, 'update']);
    Route::delete('/project-roles/{id}', [ProjectRoleController::class, 'destroy']);
});

// Timeline Stages API
use App\Http\Controllers\TimelineStageController;

// Public endpoint for active timeline stages (used by all users)
Route::middleware('auth:web')->get('/timeline-stages/active', [TimelineStageController::class, 'getActiveStages']);

// Admin-only routes for managing timeline stages
Route::middleware(['auth:web'])->prefix('admin/timeline-stages')->group(function () {
    Route::get('/', [TimelineStageController::class, 'getAllStages']);
    Route::post('/', [TimelineStageController::class, 'store']);
    Route::put('/{id}', [TimelineStageController::class, 'update']);
    Route::delete('/{id}', [TimelineStageController::class, 'destroy']);
});

Route::middleware(['auth:web'])->prefix('timeline-stages')->group(function () {
    Route::post('/update-order', [TimelineStageController::class, 'updateOrder']);
    Route::post('/{id}/toggle', [TimelineStageController::class, 'toggleActive']);
});

// Activity Logging API
use App\Http\Controllers\ActivityController;

Route::middleware('auth:web')->get('/activities/recent', [ActivityController::class, 'getRecentActivities']);
Route::middleware('auth:web')->get('/activities/dashboard', [ActivityController::class, 'getDashboardActivities']);

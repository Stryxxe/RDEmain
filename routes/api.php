<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\ProposalController;
use App\Http\Controllers\EndorsementController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\OptimizedNotificationController;
use App\Http\Controllers\Api\OptimizedMessageController;
use App\Http\Controllers\Api\SimpleOptimizedMessageController;
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Middleware\RequestDeduplication;

Route::post('/login', [AuthenticatedSessionController::class, 'store']);
Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->middleware('auth:web');

use App\Models\Department;
use App\Models\ResearchCenter;
// Get upload settings (max file size) - public endpoint for all authenticated users
Route::get('/upload-settings', function () {
    return response()->json([
        'maxFileSizeMB' => \App\Helpers\SettingsHelper::getMaxFileSizeMB(),
        'maxFileSizeKB' => \App\Helpers\SettingsHelper::getMaxFileSizeKB(),
        'allowedFileTypes' => \App\Helpers\SettingsHelper::getAllowedFileTypes(),
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
    $center->delete();
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

});

// Admin - Users management
// Explicitly use 'web' guard to ensure session authentication works
Route::middleware(['auth:web'])->group(function () {
    Route::get('/admin/users', [AdminUserController::class, 'index']);
    Route::post('/admin/users', [AdminUserController::class, 'store']);
    Route::put('/admin/users/{user:userID}', [AdminUserController::class, 'update']);
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
                        
                        // Remove from metadata
                        $metadataPath = storage_path('app/public/templates/proponent/.metadata.json');
                        if (file_exists($metadataPath)) {
                            $metadata = json_decode(file_get_contents($metadataPath), true) ?: [];
                            unset($metadata[$filename]);
                            file_put_contents($metadataPath, json_encode($metadata, JSON_PRETTY_PRINT));
                        }
                        
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
                        
                        // Remove from metadata
                        $metadataPath = storage_path('app/public/templates/general/.metadata.json');
                        if (file_exists($metadataPath)) {
                            $metadata = json_decode(file_get_contents($metadataPath), true) ?: [];
                            unset($metadata[$filename]);
                            file_put_contents($metadataPath, json_encode($metadata, JSON_PRETTY_PRINT));
                        }
                        
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

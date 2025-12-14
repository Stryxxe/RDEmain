<?php

namespace App\Http\Controllers;

use App\Models\ProgressReport;
use App\Models\Proposal;
use App\Models\File;
use App\Helpers\SettingsHelper;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class ProgressReportController extends Controller
{
    /**
     * Get all progress reports
     * For RDD users: show all reports
     * For other users: show only their own reports
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 401);
            }
            
            // Load the role relationship if not already loaded
            if (!$user->relationLoaded('role')) {
                $user->load('role');
            }

            // Use eager loading with null-safe relationships
            $query = ProgressReport::with([
                'proposal' => function($q) {
                    $q->with([
                        'user' => function($q2) {
                            $q2->with(['department', 'researchCenter']);
                        },
                        'proponents'
                    ]);
                },
                'researchCenter',
                'department',
                'user.role',
                'files'
            ]);

            $userRole = $user->role?->userRole;

            // For RDD users, show only reports submitted by CMs
            if ($userRole === 'RDD') {
                $query->whereHas('user.role', function ($q) {
                    $q->where('userRole', 'CM');
                });
            }
            // CM users: show reports submitted by proponents in the same research center
            else if ($userRole === 'CM') {
                if (!$user->researchCenterID) {
                    // If CM lacks a research center assignment, return empty without error
                    return response()->json([
                        'success' => true,
                        'data' => collect(),
                        'message' => 'CM user has no research center assigned; no reports available'
                    ]);
                }

                // Show reports submitted by proponents (not by CMs) in the same research center
                // Also include reports where proposalID is null but researchCenterID matches (CM submitted)
                $query->where(function ($q) use ($user) {
                    // Case 1: Reports from proponents in same research center
                    $q->where(function ($q2) use ($user) {
                        $q2->whereHas('user.role', function ($q3) {
                            $q3->where('userRole', '!=', 'CM')
                              ->where('userRole', '!=', 'RDD');
                        })->whereHas('proposal.user', function ($q3) use ($user) {
                            $q3->where('researchCenterID', $user->researchCenterID);
                        });
                    })
                    // Case 2: Reports with no proposal but same research center (CM submitted)
                    ->orWhere(function ($q2) use ($user) {
                        $q2->whereNull('proposalID')
                           ->where('researchCenterID', $user->researchCenterID);
                    });
                });
            }
            // Other users: only their own reports
            else {
                $query->where('userID', $user->userID);
            }

            $reports = $query->orderBy('submittedAt', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $reports
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching progress reports: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            
            // Check if table doesn't exist
            if (str_contains($e->getMessage(), "doesn't exist") || str_contains($e->getMessage(), 'Base table or view not found')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Progress reports table does not exist. Please run migrations.',
                    'error' => 'Database table not found. Run: php artisan migrate'
                ], 500);
            }
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch progress reports',
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
        }
    }

    /**
     * Store a new progress report
     */
    public function store(Request $request): JsonResponse
    {
        // Get dynamic max file size from settings
        $maxFileSizeKB = SettingsHelper::getMaxFileSizeKB();
        
        $validator = Validator::make($request->all(), [
            'proposalID' => 'nullable|exists:proposals,proposalID',
            'reportType' => 'nullable|string|in:Quarterly,Annual,Final,Interim,General',
            'reportPeriod' => 'nullable|string',
            'progressPercentage' => 'nullable|integer|min:0|max:100',
            'budgetUtilized' => 'nullable|numeric|min:0',
            'achievements' => 'required|string',
            'challenges' => 'nullable|string',
            'nextMilestone' => 'nullable|string',
            'additionalNotes' => 'nullable|string',
            'files' => 'nullable|array|max:10',
            'files.*' => "file|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx|max:{$maxFileSizeKB}"
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = Auth::user();

            // Load user role
            if (!$user->relationLoaded('role')) {
                $user->load('role');
            }
            $userRole = $user->role ? $user->role->userRole : null;

            // For non-CM users, proposalID is required
            if (!$request->proposalID && $userRole !== 'CM') {
                return response()->json([
                    'success' => false,
                    'message' => 'Proposal ID is required'
                ], 400);
            }

            $proposal = null;
            $proposalID = null;

            // If proposalID is provided, verify it exists and user has permission
            if ($request->proposalID) {
                $proposalID = $request->proposalID;
                $proposal = Proposal::find($proposalID);
                
                if (!$proposal) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Proposal not found'
                    ], 404);
                }

                // Load proposal user, department, research center, and proponents relationships
                if (!$proposal->relationLoaded('user')) {
                    $proposal->load('user');
                }
                if ($proposal->user && !$proposal->user->relationLoaded('department')) {
                    $proposal->user->load('department');
                }
                if ($proposal->user && !$proposal->user->relationLoaded('researchCenter')) {
                    $proposal->user->load('researchCenter');
                }
                if (!$proposal->relationLoaded('proponents')) {
                    $proposal->load('proponents');
                }

                // Check if user has permission to submit report for this proposal
                // RDD users can submit reports for any proposal
                if ($userRole === 'RDD') {
                    // Allow
                }
                // CM users can submit reports for proposals in their research center (for monitoring)
                else if ($userRole === 'CM') {
                    // Check if user has research center assigned
                    if (!$user->researchCenterID) {
                        return response()->json([
                            'success' => false,
                            'message' => 'You must be assigned to a research center to submit reports'
                        ], 403);
                    }
                    // Check if proposal's user is in the same research center
                    if ($proposal->user->researchCenterID !== $user->researchCenterID) {
                        return response()->json([
                            'success' => false,
                            'message' => 'You can only submit reports for proposals in your research center'
                        ], 403);
                    }
                }
                // Other users (Proponents) can submit reports for proposals they're part of
                else {
                    // Check if user is the primary proposer
                    $isPrimaryProposer = $proposal->userID === $user->userID;
                    
                    // Check if user is a proponent (co-author) of the proposal
                    $isProponent = $proposal->proponents()
                        ->where('users.userID', $user->userID)
                        ->exists();
                    
                    if (!$isPrimaryProposer && !$isProponent) {
                        return response()->json([
                            'success' => false,
                            'message' => 'You can only submit reports for proposals you are part of'
                        ], 403);
                    }
                }
            }

            // Load user department and research center if needed
            if (!$user->relationLoaded('department')) {
                $user->load('department');
            }
            if (!$user->relationLoaded('researchCenter')) {
                $user->load('researchCenter');
            }
            // Create the progress report
            $report = ProgressReport::create([
                'proposalID' => $proposalID,
                'userID' => $user->userID,
                'researchCenterID' => $user->researchCenterID,
                'departmentID' => $user->departmentID,
                'reportType' => $request->reportType ?: 'General',
                'reportPeriod' => $request->reportPeriod ?: 'N/A',
                'progressPercentage' => $request->progressPercentage ?? 0,
                'budgetUtilized' => $request->budgetUtilized,
                'achievements' => $request->achievements,
                'challenges' => $request->challenges,
                'nextMilestone' => $request->nextMilestone ?: 'N/A',
                'additionalNotes' => $request->additionalNotes,
                'submittedAt' => now()
            ]);

            // Handle file uploads
            if ($request->hasFile('files')) {
                foreach ($request->file('files') as $file) {
                    $filename = time() . '_' . $file->getClientOriginalName();
                    $path = $file->storeAs('progress_reports/' . $report->reportID, $filename, 'public');
                    
                    $fileData = [
                        'reportID' => $report->reportID,
                        'fileName' => $filename,
                        'filePath' => $path,
                        'fileType' => 'progress_report',
                        'fileSize' => $file->getSize()
                    ];
                    
                    // Only include proposalID if it's provided (not null)
                    if ($proposalID) {
                        $fileData['proposalID'] = $proposalID;
                    }
                    
                    File::create($fileData);
                }
            }

            $report->load(['proposal.user.department', 'user', 'files']);

            return response()->json([
                'success' => true,
                'message' => 'Progress report submitted successfully',
                'data' => $report
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit progress report',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific progress report by ID
     */
    public function show($id): JsonResponse
    {
        try {
            $user = Auth::user();
            
            if (!$user->relationLoaded('role')) {
                $user->load('role');
            }

            $query = ProgressReport::with(['proposal.user.department', 'user', 'files'])
                ->where('reportID', $id);

            $userRole = $user->role?->userRole;

            if ($userRole === 'RDD') {
                // RDD can view any report
            } else if ($userRole === 'CM') {
                if (!$user->researchCenterID) {
                    return response()->json([
                        'success' => false,
                        'message' => 'CM user has no research center assigned'
                    ], 403);
                }

                $query->whereHas('proposal.user', function ($q) use ($user) {
                    $q->where('researchCenterID', $user->researchCenterID);
                });
            } else {
                // Other users: only their own reports
                $query->where('userID', $user->userID);
            }

            $report = $query->first();

            if (!$report) {
                return response()->json([
                    'success' => false,
                    'message' => 'Progress report not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $report
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch progress report',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}


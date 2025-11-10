<?php

namespace App\Http\Controllers;

use App\Models\ProgressReport;
use App\Models\Proposal;
use App\Models\File;
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
                    $q->with(['user' => function($q2) {
                        $q2->with('department');
                    }]);
                },
                'user',
                'files'
            ]);

            // For RDD users, show all reports; for others, show only their own
            if ($user->role && $user->role->userRole === 'RDD') {
                // RDD users can see all reports - no filtering needed
            } else {
                // For other users, show only their own reports
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
        $validator = Validator::make($request->all(), [
            'proposalID' => 'required|exists:proposals,proposalID',
            'reportType' => 'required|string|in:Quarterly,Annual,Final,Interim',
            'reportPeriod' => 'required|string',
            'progressPercentage' => 'required|integer|min:0|max:100',
            'budgetUtilized' => 'nullable|numeric|min:0',
            'achievements' => 'required|string',
            'challenges' => 'nullable|string',
            'nextMilestone' => 'required|string',
            'additionalNotes' => 'nullable|string',
            'files' => 'nullable|array',
            'files.*' => 'file|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx|max:10240' // 10MB max
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

            // Verify the proposal belongs to the user (unless they're RDD)
            $proposal = Proposal::find($request->proposalID);
            if (!$proposal) {
                return response()->json([
                    'success' => false,
                    'message' => 'Proposal not found'
                ], 404);
            }

            // Check if user has permission to submit report for this proposal
            if (!$user->relationLoaded('role')) {
                $user->load('role');
            }

            if ($user->role && $user->role->userRole !== 'RDD' && $proposal->userID !== $user->userID) {
                return response()->json([
                    'success' => false,
                    'message' => 'You can only submit reports for your own proposals'
                ], 403);
            }

            // Create the progress report
            $report = ProgressReport::create([
                'proposalID' => $request->proposalID,
                'userID' => $user->userID,
                'reportType' => $request->reportType,
                'reportPeriod' => $request->reportPeriod,
                'progressPercentage' => $request->progressPercentage,
                'budgetUtilized' => $request->budgetUtilized,
                'achievements' => $request->achievements,
                'challenges' => $request->challenges,
                'nextMilestone' => $request->nextMilestone,
                'additionalNotes' => $request->additionalNotes,
                'submittedAt' => now()
            ]);

            // Handle file uploads
            if ($request->hasFile('files')) {
                foreach ($request->file('files') as $file) {
                    $filename = time() . '_' . $file->getClientOriginalName();
                    $path = $file->storeAs('progress_reports/' . $report->reportID, $filename, 'public');
                    
                    File::create([
                        'proposalID' => $request->proposalID,
                        'reportID' => $report->reportID,
                        'fileName' => $filename,
                        'filePath' => $path,
                        'fileType' => 'progress_report',
                        'fileSize' => $file->getSize()
                    ]);
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

            // For non-RDD users, only show their own reports
            if ($user->role && $user->role->userRole !== 'RDD') {
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

